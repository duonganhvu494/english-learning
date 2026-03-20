import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Material,
  MaterialStatus,
} from 'src/materials/entities/material.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { StorageDownloadTarget } from 'src/storage/interfaces/storage-download-target.interface';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { User } from 'src/users/entities/user.entity';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { LectureDeleteResponseDto } from './dto/lecture-delete-response.dto';
import { LectureResponseDto } from './dto/lecture-response.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { LectureEntity } from './entities/lecture.entity';
import { LectureMaterial } from './entities/lecture-material.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class LecturesService {
  constructor(
    @InjectRepository(LectureEntity)
    private readonly lectureRepo: Repository<LectureEntity>,

    @InjectRepository(LectureMaterial)
    private readonly lectureMaterialRepo: Repository<LectureMaterial>,

    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,

    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly s3StorageService: S3StorageService,
  ) {}

  async createLecture(
    sessionId: string,
    dto: CreateLectureDto,
    actorUserId: string,
  ): Promise<LectureResponseDto> {
    const [session, actor] = await Promise.all([
      this.loadSessionOrThrow(sessionId),
      this.loadActorOrThrow(actorUserId),
    ]);

    const materials = await this.resolveMaterials(
      dto.materialIds,
      session.classEntity.workspace.id,
    );
    const normalizedTitle = this.normalizeTitle(dto.title);
    const normalizedDescription = this.normalizeDescription(dto.description);

    const lecture = await this.lectureRepo.manager.transaction(async (manager) => {
      const lectureRepo = manager.getRepository(LectureEntity);
      const lectureMaterialRepo = manager.getRepository(LectureMaterial);

      const createdLecture = lectureRepo.create({
        session,
        title: normalizedTitle,
        description: normalizedDescription,
        createdBy: actor,
        updatedBy: actor,
      });
      const savedLecture = await lectureRepo.save(createdLecture);

      if (materials.length > 0) {
        await lectureMaterialRepo.save(
          materials.map((material, index) =>
            lectureMaterialRepo.create({
              lecture: savedLecture,
              material,
              sortOrder: index,
            }),
          ),
        );
      }

      return savedLecture;
    });

    return this.getLectureDetail(lecture.id);
  }

  async listSessionLectures(sessionId: string): Promise<LectureResponseDto[]> {
    await this.loadSessionOrThrow(sessionId);

    const lectures = await this.lectureRepo.find({
      where: {
        session: { id: sessionId },
      },
      relations: {
        session: {
          classEntity: true,
        },
        lectureMaterials: {
          material: true,
        },
      },
      order: {
        createdAt: 'ASC',
        lectureMaterials: {
          sortOrder: 'ASC',
        },
      },
    });

    return lectures.map((lecture) => LectureResponseDto.fromEntity(lecture));
  }

  async getLectureDetail(lectureId: string): Promise<LectureResponseDto> {
    const lecture = await this.lectureRepo.findOne({
      where: { id: lectureId },
      relations: {
        session: {
          classEntity: true,
        },
        lectureMaterials: {
          material: true,
        },
      },
    });
    if (!lecture) {
      throw new BadRequestException(
        errorPayload('Lecture not found', 'LECTURE_NOT_FOUND'),
      );
    }

    return LectureResponseDto.fromEntity(lecture);
  }

  async updateLecture(
    lectureId: string,
    dto: UpdateLectureDto,
    actorUserId: string,
  ): Promise<LectureResponseDto> {
    const [lecture, actor] = await Promise.all([
      this.lectureRepo.findOne({
        where: { id: lectureId },
        relations: {
          session: {
            classEntity: {
              workspace: true,
            },
          },
        },
      }),
      this.loadActorOrThrow(actorUserId),
    ]);
    if (!lecture) {
      throw new BadRequestException(
        errorPayload('Lecture not found', 'LECTURE_NOT_FOUND'),
      );
    }

    if (dto.title !== undefined) {
      lecture.title = this.normalizeTitle(dto.title);
    }

    if (dto.description !== undefined) {
      lecture.description = this.normalizeDescription(dto.description);
    }

    lecture.updatedBy = actor;

    const materials =
      dto.materialIds !== undefined
        ? await this.resolveMaterials(
            dto.materialIds,
            lecture.session.classEntity.workspace.id,
          )
        : undefined;

    await this.lectureRepo.manager.transaction(async (manager) => {
      const lectureRepo = manager.getRepository(LectureEntity);
      const lectureMaterialRepo = manager.getRepository(LectureMaterial);

      await lectureRepo.save(lecture);

      if (materials !== undefined) {
        await lectureMaterialRepo.delete({
          lecture: { id: lecture.id },
        });

        if (materials.length > 0) {
          await lectureMaterialRepo.save(
            materials.map((material, index) =>
              lectureMaterialRepo.create({
                lecture,
                material,
                sortOrder: index,
              }),
            ),
          );
        }
      }
    });

    return this.getLectureDetail(lecture.id);
  }

  async deleteLecture(lectureId: string): Promise<LectureDeleteResponseDto> {
    const lecture = await this.lectureRepo.findOne({
      where: { id: lectureId },
      select: {
        id: true,
      },
    });
    if (!lecture) {
      throw new BadRequestException(
        errorPayload('Lecture not found', 'LECTURE_NOT_FOUND'),
      );
    }

    await this.lectureRepo.delete(lectureId);
    return LectureDeleteResponseDto.fromData({ lectureId });
  }

  async getLectureMaterialDownloadTarget(
    lectureId: string,
    materialId: string,
  ): Promise<StorageDownloadTarget> {
    const lectureMaterial = await this.lectureMaterialRepo.findOne({
      where: {
        lecture: { id: lectureId },
        material: { id: materialId },
      },
      relations: {
        material: true,
      },
    });
    if (!lectureMaterial) {
      throw new BadRequestException(
        errorPayload(
          'Material is not attached to this lecture',
          'LECTURE_MATERIAL_NOT_ATTACHED',
        ),
      );
    }

    if (
      lectureMaterial.material.status !== MaterialStatus.READY ||
      !lectureMaterial.material.bucket ||
      !lectureMaterial.material.objectKey
    ) {
      throw new BadRequestException(
        errorPayload(
          'Lecture material is not ready for download',
          'LECTURE_MATERIAL_NOT_READY',
        ),
      );
    }

    return {
      type: 'remote',
      url: await this.s3StorageService.createSignedDownloadUrl({
        bucket: lectureMaterial.material.bucket,
        objectKey: lectureMaterial.material.objectKey,
        fileName: lectureMaterial.material.fileName,
      }),
    };
  }

  private async loadSessionOrThrow(sessionId: string): Promise<SessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload('Session not found', 'LECTURE_SESSION_NOT_FOUND'),
      );
    }

    return session;
  }

  private async loadActorOrThrow(actorUserId: string): Promise<User> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
    });
    if (!actor) {
      throw new BadRequestException(
        errorPayload('User not found', 'LECTURE_ACTOR_NOT_FOUND'),
      );
    }

    return actor;
  }

  private async resolveMaterials(
    materialIds: string[] | undefined,
    workspaceId: string,
  ): Promise<Material[]> {
    const uniqueMaterialIds = [...new Set(materialIds ?? [])];
    if (uniqueMaterialIds.length === 0) {
      return [];
    }

    const materials = await this.materialRepo.find({
      where: {
        id: In(uniqueMaterialIds),
        workspace: { id: workspaceId },
      },
    });

    if (materials.length !== uniqueMaterialIds.length) {
      throw new BadRequestException(
        errorPayload(
          'One or more materials were not found in this workspace',
          'LECTURE_MATERIALS_NOT_FOUND',
        ),
      );
    }

    if (
      materials.some(
        (material) =>
          material.status !== MaterialStatus.READY ||
          !material.bucket ||
          !material.objectKey,
      )
    ) {
      throw new BadRequestException(
        errorPayload(
          'One or more materials are not ready to use',
          'LECTURE_MATERIALS_NOT_READY',
        ),
      );
    }

    const materialMap = new Map(materials.map((material) => [material.id, material]));
    return uniqueMaterialIds.map((materialId) => {
      const material = materialMap.get(materialId);
      if (!material) {
        throw new BadRequestException(
          errorPayload(
            'One or more materials were not found in this workspace',
            'LECTURE_MATERIALS_NOT_FOUND',
          ),
        );
      }

      return material;
    });
  }

  private normalizeTitle(title: string): string {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      throw new BadRequestException(
        errorPayload('title can not be empty', 'LECTURE_TITLE_REQUIRED'),
      );
    }

    return normalizedTitle;
  }

  private normalizeDescription(description?: string): string | null {
    if (description === undefined) {
      return null;
    }

    return description.trim() || null;
  }
}
