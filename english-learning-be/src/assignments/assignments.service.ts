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
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { AssignmentDeleteResponseDto } from './dto/assignment-delete-response.dto';
import { AssignmentResponseDto } from './dto/assignment-response.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentEntity, AssignmentType } from './entities/assignment.entity';
import { AssignmentMaterial } from './entities/assignment-material.entity';
import { AssignmentQuizAttemptEntity } from './entities/assignment-quiz-attempt.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(AssignmentMaterial)
    private readonly assignmentMaterialRepo: Repository<AssignmentMaterial>,

    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,

    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    @InjectRepository(AssignmentQuizAttemptEntity)
    private readonly attemptRepo: Repository<AssignmentQuizAttemptEntity>,

    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly s3StorageService: S3StorageService,
  ) {}

  async createAssignment(
    sessionId: string,
    dto: CreateAssignmentDto,
    actorUserId: string,
  ): Promise<AssignmentResponseDto> {
    const [session, actor] = await Promise.all([
      this.loadSessionOrThrow(sessionId),
      this.loadActorOrThrow(actorUserId),
    ]);

    const { timeStart, timeEnd } = this.parseAssignmentWindow(
      dto.timeStart,
      dto.timeEnd,
    );
    const materials = await this.resolveMaterials(
      dto.materialIds,
      session.classEntity.workspace.id,
    );
    const normalizedTitle = this.normalizeTitle(dto.title);
    const normalizedDescription = this.normalizeDescription(dto.description);

    const assignment = await this.assignmentRepo.manager.transaction(
      async (manager) => {
        const assignmentRepo = manager.getRepository(AssignmentEntity);
        const assignmentMaterialRepo = manager.getRepository(AssignmentMaterial);

        const createdAssignment = assignmentRepo.create({
          session,
          type: dto.type ?? AssignmentType.MANUAL,
          title: normalizedTitle,
          description: normalizedDescription,
          timeStart,
          timeEnd,
          createdBy: actor,
          updatedBy: actor,
        });
        const savedAssignment = await assignmentRepo.save(createdAssignment);

        if (materials.length > 0) {
          await assignmentMaterialRepo.save(
            materials.map((material, index) =>
              assignmentMaterialRepo.create({
                assignment: savedAssignment,
                material,
                sortOrder: index,
              }),
            ),
          );
        }

        return savedAssignment;
      },
    );

    return this.getAssignmentDetail(assignment.id);
  }

  async listSessionAssignments(
    sessionId: string,
  ): Promise<AssignmentResponseDto[]> {
    await this.loadSessionOrThrow(sessionId);

    const assignments = await this.assignmentRepo.find({
      where: {
        session: { id: sessionId },
      },
      relations: {
        session: {
          classEntity: true,
        },
        assignmentMaterials: {
          material: true,
        },
      },
      order: {
        timeStart: 'ASC',
        timeEnd: 'ASC',
        createdAt: 'ASC',
        assignmentMaterials: {
          sortOrder: 'ASC',
        },
      },
    });

    return assignments.map((assignment) =>
      AssignmentResponseDto.fromEntity(assignment),
    );
  }

  async getAssignmentDetail(
    assignmentId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: {
        session: {
          classEntity: true,
        },
        assignmentMaterials: {
          material: true,
        },
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        errorPayload('Assignment not found', 'ASSIGNMENT_NOT_FOUND'),
      );
    }

    return AssignmentResponseDto.fromEntity(assignment);
  }

  async deleteAssignment(
    assignmentId: string,
  ): Promise<AssignmentDeleteResponseDto> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      select: {
        id: true,
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        errorPayload('Assignment not found', 'ASSIGNMENT_NOT_FOUND'),
      );
    }

    const [submissionCount, attemptCount] = await Promise.all([
      this.submissionRepo.count({
        where: {
          assignment: { id: assignmentId },
        },
      }),
      this.attemptRepo.count({
        where: {
          assignment: { id: assignmentId },
        },
      }),
    ]);

    if (submissionCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot delete assignment after students have submitted work',
          'ASSIGNMENT_DELETE_BLOCKED_HAS_SUBMISSIONS',
        ),
      );
    }

    if (attemptCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot delete assignment after students have started quiz attempts',
          'ASSIGNMENT_DELETE_BLOCKED_HAS_ATTEMPTS',
        ),
      );
    }

    await this.assignmentRepo.delete(assignmentId);
    return AssignmentDeleteResponseDto.fromData({ assignmentId });
  }

  async getAssignmentMaterialDownloadTarget(
    assignmentId: string,
    materialId: string,
  ): Promise<StorageDownloadTarget> {
    const assignmentMaterial = await this.assignmentMaterialRepo.findOne({
      where: {
        assignment: { id: assignmentId },
        material: { id: materialId },
      },
      relations: {
        material: true,
      },
    });
    if (!assignmentMaterial) {
      throw new BadRequestException(
        errorPayload(
          'Material is not attached to this assignment',
          'ASSIGNMENT_MATERIAL_NOT_ATTACHED',
        ),
      );
    }

    if (
      assignmentMaterial.material.status !== MaterialStatus.READY ||
      !assignmentMaterial.material.bucket ||
      !assignmentMaterial.material.objectKey
    ) {
      throw new BadRequestException(
        errorPayload(
          'Assignment material is not ready for download',
          'ASSIGNMENT_MATERIAL_NOT_READY',
        ),
      );
    }

    return {
      type: 'remote',
      url: await this.s3StorageService.createSignedDownloadUrl({
        bucket: assignmentMaterial.material.bucket,
        objectKey: assignmentMaterial.material.objectKey,
        fileName: assignmentMaterial.material.fileName,
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
        errorPayload('Session not found', 'ASSIGNMENT_SESSION_NOT_FOUND'),
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
        errorPayload('User not found', 'ASSIGNMENT_ACTOR_NOT_FOUND'),
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
          'ASSIGNMENT_MATERIALS_NOT_FOUND',
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
          'ASSIGNMENT_MATERIALS_NOT_READY',
        ),
      );
    }

    const materialMap = new Map(
      materials.map((material) => [material.id, material]),
    );
    return uniqueMaterialIds.map((materialId) => {
      const material = materialMap.get(materialId);
      if (!material) {
        throw new BadRequestException(
          errorPayload(
            'One or more materials were not found in this workspace',
            'ASSIGNMENT_MATERIALS_NOT_FOUND',
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
        errorPayload('title can not be empty', 'ASSIGNMENT_TITLE_REQUIRED'),
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

  private parseAssignmentWindow(
    timeStartInput: string,
    timeEndInput: string,
  ): { timeStart: Date; timeEnd: Date } {
    const timeStart = new Date(timeStartInput);
    const timeEnd = new Date(timeEndInput);
    if (Number.isNaN(timeStart.getTime())) {
      throw new BadRequestException(
        errorPayload('timeStart is invalid', 'ASSIGNMENT_TIME_START_INVALID'),
      );
    }

    if (Number.isNaN(timeEnd.getTime())) {
      throw new BadRequestException(
        errorPayload('timeEnd is invalid', 'ASSIGNMENT_TIME_END_INVALID'),
      );
    }

    if (timeEnd <= timeStart) {
      throw new BadRequestException(
        errorPayload(
          'timeEnd must be greater than timeStart',
          'ASSIGNMENT_TIME_WINDOW_INVALID',
        ),
      );
    }

    return { timeStart, timeEnd };
  }
}
