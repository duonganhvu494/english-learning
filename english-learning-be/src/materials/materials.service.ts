import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentMaterial } from 'src/assignments/entities/assignment-material.entity';
import { AssignmentQuizQuestionEntity } from 'src/assignments/entities/assignment-quiz-question.entity';
import { LectureMaterial } from 'src/lectures/entities/lecture-material.entity';
import { StorageDownloadTarget } from 'src/storage/interfaces/storage-download-target.interface';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { validateMultipartUploadRequest } from 'src/storage/utils/storage-upload-validation.util';
import { User } from 'src/users/entities/user.entity';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { AbortMaterialUploadDto } from './dto/abort-material-upload.dto';
import { CompleteMaterialUploadDto } from './dto/complete-material-upload.dto';
import { InitMaterialUploadDto } from './dto/init-material-upload.dto';
import { MaterialUploadAbortResponseDto } from './dto/material-upload-abort-response.dto';
import { MaterialUploadInitResponseDto } from './dto/material-upload-init-response.dto';
import { MaterialUploadPartSignedResponseDto } from './dto/material-upload-part-signed-response.dto';
import { MaterialDeleteResponseDto } from './dto/material-delete-response.dto';
import { MaterialResponseDto } from './dto/material-response.dto';
import { SignMaterialUploadPartDto } from './dto/sign-material-upload-part.dto';
import {
  Material,
  MaterialCategory,
  MaterialStatus,
} from './entities/material.entity';
import {
  MaterialUploadSession,
  MaterialUploadSessionStatus,
} from './entities/material-upload-session.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,

    @InjectRepository(LectureMaterial)
    private readonly lectureMaterialRepo: Repository<LectureMaterial>,

    @InjectRepository(AssignmentMaterial)
    private readonly assignmentMaterialRepo: Repository<AssignmentMaterial>,

    @InjectRepository(AssignmentQuizQuestionEntity)
    private readonly assignmentQuizQuestionRepo: Repository<AssignmentQuizQuestionEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    @InjectRepository(MaterialUploadSession)
    private readonly uploadSessionRepo: Repository<MaterialUploadSession>,

    private readonly s3StorageService: S3StorageService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async initMaterialUpload(
    workspaceId: string,
    dto: InitMaterialUploadDto,
    actorUserId: string,
  ): Promise<MaterialUploadInitResponseDto> {
    const [workspace, actor] = await Promise.all([
      this.assertWorkspaceOwnerForMaterials(workspaceId, actorUserId),
      this.userRepo.findOne({
        where: { id: actorUserId },
      }),
    ]);
    if (!actor) {
      throw new BadRequestException(
        errorPayload('User not found', 'MATERIAL_ACTOR_NOT_FOUND'),
      );
    }

    const fileName = dto.fileName.trim();
    if (!fileName) {
      throw new BadRequestException(
        errorPayload('fileName can not be empty', 'MATERIAL_FILE_NAME_REQUIRED'),
      );
    }

    const title = dto.title?.trim() || fileName;
    if (!title) {
      throw new BadRequestException(
        errorPayload('title can not be empty', 'MATERIAL_TITLE_REQUIRED'),
      );
    }

    const { mimeType, totalParts } = validateMultipartUploadRequest({
      size: dto.size,
      mimeType: dto.mimeType,
      partSize: this.s3StorageService.multipartPartSize,
      maxUploadSizeBytes: this.s3StorageService.maxUploadSizeBytes,
      maxMultipartParts: this.s3StorageService.maxMultipartParts,
      allowedMimeTypes: this.s3StorageService.allowedMimeTypes,
    });

    const objectKey = this.s3StorageService.buildMaterialObjectKey({
      workspaceId,
      category: dto.category ?? MaterialCategory.GENERAL,
      fileName,
    });
    const { bucket, uploadId } =
      await this.s3StorageService.createMultipartUpload({
        objectKey,
        mimeType,
      });
    const partSize = this.s3StorageService.multipartPartSize;
    const expiresAt = new Date(
      Date.now() + this.s3StorageService.uploadSessionExpiresInSeconds * 1000,
    );

    const savedMaterial = await this.materialRepo.save(
      this.materialRepo.create({
        workspace,
        title,
        status: MaterialStatus.PENDING,
        bucket,
        objectKey,
        fileName,
        mimeType,
        size: dto.size,
        category: dto.category ?? MaterialCategory.GENERAL,
        uploadedBy: actor,
      }),
    );

    const uploadSession = await this.uploadSessionRepo.save(
      this.uploadSessionRepo.create({
        material: savedMaterial,
        workspace,
        uploadedBy: actor,
        uploadId,
        bucket,
        objectKey,
        fileName,
        mimeType,
        size: String(dto.size),
        partSize,
        totalParts,
        status: MaterialUploadSessionStatus.INITIATED,
        expiresAt,
        completedAt: null,
      }),
    );

    return MaterialUploadInitResponseDto.fromData({
      materialId: savedMaterial.id,
      uploadSessionId: uploadSession.id,
      uploadId,
      objectKey,
      partSize,
      totalParts,
      expiresAt,
    });
  }

  async signMaterialUploadPart(
    workspaceId: string,
    dto: SignMaterialUploadPartDto,
    actorUserId: string,
  ): Promise<MaterialUploadPartSignedResponseDto> {
    await this.assertWorkspaceOwnerForMaterials(workspaceId, actorUserId);
    const uploadSession = await this.loadUploadSessionOrThrow({
      workspaceId,
      materialId: dto.materialId,
      uploadSessionId: dto.uploadSessionId,
      uploadId: dto.uploadId,
      objectKey: dto.objectKey,
    });
    this.ensureUploadSessionCanContinue(uploadSession);

    if (dto.partNumber > uploadSession.totalParts) {
      throw new BadRequestException(
        errorPayload(
          'partNumber exceeds totalParts',
          'MATERIAL_UPLOAD_PART_NUMBER_OUT_OF_RANGE',
        ),
      );
    }

    if (uploadSession.status === MaterialUploadSessionStatus.INITIATED) {
      uploadSession.status = MaterialUploadSessionStatus.UPLOADING;
      await this.uploadSessionRepo.save(uploadSession);
    }

    const url = await this.s3StorageService.signUploadPart({
      objectKey: uploadSession.objectKey,
      uploadId: uploadSession.uploadId,
      partNumber: dto.partNumber,
    });

    return MaterialUploadPartSignedResponseDto.fromData({
      partNumber: dto.partNumber,
      url,
    });
  }

  async completeMaterialUpload(
    workspaceId: string,
    dto: CompleteMaterialUploadDto,
    actorUserId: string,
  ): Promise<MaterialResponseDto> {
    await this.assertWorkspaceOwnerForMaterials(workspaceId, actorUserId);
    const uploadSession = await this.loadUploadSessionOrThrow({
      workspaceId,
      materialId: dto.materialId,
      uploadSessionId: dto.uploadSessionId,
      uploadId: dto.uploadId,
      objectKey: dto.objectKey,
    });
    this.ensureUploadSessionCanContinue(uploadSession);

    const sortedParts = [...dto.parts].sort(
      (a, b) => a.partNumber - b.partNumber,
    );
    if (sortedParts.length !== uploadSession.totalParts) {
      throw new BadRequestException(
        errorPayload(
          'Uploaded parts do not match totalParts',
          'MATERIAL_UPLOAD_PARTS_COUNT_MISMATCH',
        ),
      );
    }
    sortedParts.forEach((part, index) => {
      if (part.partNumber !== index + 1) {
        throw new BadRequestException(
          errorPayload(
            'parts must be sequential from 1',
            'MATERIAL_UPLOAD_PARTS_NOT_SEQUENTIAL',
          ),
        );
      }
    });

    await this.s3StorageService.completeMultipartUpload({
      objectKey: uploadSession.objectKey,
      uploadId: uploadSession.uploadId,
      parts: sortedParts.map((part) => ({
        partNumber: part.partNumber,
        etag: part.etag,
      })),
    });

    uploadSession.status = MaterialUploadSessionStatus.COMPLETED;
    uploadSession.completedAt = new Date();
    await this.uploadSessionRepo.save(uploadSession);

    uploadSession.material.status = MaterialStatus.READY;
    const savedMaterial = await this.materialRepo.save(uploadSession.material);

    return this.getMaterialDetail(savedMaterial.id);
  }

  async abortMaterialUpload(
    workspaceId: string,
    dto: AbortMaterialUploadDto,
    actorUserId: string,
  ): Promise<MaterialUploadAbortResponseDto> {
    await this.assertWorkspaceOwnerForMaterials(workspaceId, actorUserId);
    const uploadSession = await this.loadUploadSessionOrThrow({
      workspaceId,
      materialId: dto.materialId,
      uploadSessionId: dto.uploadSessionId,
      uploadId: dto.uploadId,
      objectKey: dto.objectKey,
    });
    this.ensureUploadSessionCanContinue(uploadSession);

    await this.s3StorageService.abortMultipartUpload({
      objectKey: uploadSession.objectKey,
      uploadId: uploadSession.uploadId,
    });

    uploadSession.status = MaterialUploadSessionStatus.ABORTED;
    await this.uploadSessionRepo.save(uploadSession);

    uploadSession.material.status = MaterialStatus.FAILED;
    await this.materialRepo.save(uploadSession.material);

    return MaterialUploadAbortResponseDto.fromData({
      materialId: uploadSession.material.id,
      uploadSessionId: uploadSession.id,
      status: uploadSession.status,
    });
  }

  async listWorkspaceMaterials(
    workspaceId: string,
    actorUserId: string,
  ): Promise<MaterialResponseDto[]> {
    await this.assertWorkspaceOwnerForMaterials(workspaceId, actorUserId);

    const materials = await this.materialRepo.find({
      where: {
        workspace: { id: workspaceId },
      },
      relations: {
        workspace: true,
        uploadedBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return materials.map((material) => MaterialResponseDto.fromEntity(material));
  }

  async getMaterialDetail(materialId: string): Promise<MaterialResponseDto> {
    const material = await this.findMaterialOrThrow(materialId);
    return MaterialResponseDto.fromEntity(material);
  }

  async getMaterialDownloadTarget(
    materialId: string,
  ): Promise<StorageDownloadTarget> {
    const material = await this.findMaterialOrThrow(materialId);
    this.ensureMaterialReady(
      material,
      'Material is not ready for download',
      'MATERIAL_NOT_READY',
    );

    return {
      type: 'remote',
      url: await this.s3StorageService.createSignedDownloadUrl({
        bucket: material.bucket,
        objectKey: material.objectKey,
        fileName: material.fileName,
      }),
    };
  }

  async deleteMaterial(materialId: string): Promise<MaterialDeleteResponseDto> {
    const material = await this.findMaterialOrThrow(materialId);
    const lectureUsageCount = await this.lectureMaterialRepo.count({
      where: {
        material: { id: materialId },
      },
    });
    if (lectureUsageCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot delete material while it is still attached to lectures',
          'MATERIAL_IN_USE_BY_LECTURES',
        ),
      );
    }

    const assignmentUsageCount = await this.assignmentMaterialRepo.count({
      where: {
        material: { id: materialId },
      },
    });
    if (assignmentUsageCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot delete material while it is still attached to assignments',
          'MATERIAL_IN_USE_BY_ASSIGNMENTS',
        ),
      );
    }

    const submissionUsageCount = await this.submissionRepo.count({
      where: {
        material: { id: materialId },
      },
    });
    if (submissionUsageCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot delete material while it is still attached to submissions',
          'MATERIAL_IN_USE_BY_SUBMISSIONS',
        ),
      );
    }

    const quizQuestionUsageCount = await this.assignmentQuizQuestionRepo.count({
      where: {
        material: { id: materialId },
      },
    });
    if (quizQuestionUsageCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot delete material while it is still attached to quiz questions',
          'MATERIAL_IN_USE_BY_QUIZ_QUESTIONS',
        ),
      );
    }

    await this.materialRepo.delete(materialId);
    await this.removeMaterialAsset(material);

    return MaterialDeleteResponseDto.fromData({ materialId });
  }

  private async findMaterialOrThrow(materialId: string): Promise<Material> {
    const material = await this.materialRepo.findOne({
      where: { id: materialId },
      relations: {
        workspace: true,
        uploadedBy: true,
      },
    });
    if (!material) {
      throw new BadRequestException(
        errorPayload('Material not found', 'MATERIAL_NOT_FOUND'),
      );
    }

    return material;
  }

  private async assertWorkspaceOwnerForMaterials(
    workspaceId: string,
    actorUserId: string,
  ): Promise<Workspace> {
    return this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can manage materials',
        ownerForbiddenCode: 'MATERIAL_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage materials',
        teacherForbiddenCode: 'MATERIAL_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );
  }

  private async loadUploadSessionOrThrow(input: {
    workspaceId: string;
    materialId: string;
    uploadSessionId: string;
    uploadId: string;
    objectKey: string;
  }): Promise<MaterialUploadSession> {
    const uploadSession = await this.uploadSessionRepo.findOne({
      where: {
        id: input.uploadSessionId,
        uploadId: input.uploadId,
        objectKey: input.objectKey,
        workspace: { id: input.workspaceId },
        material: { id: input.materialId },
      },
      relations: {
        material: true,
      },
    });
    if (!uploadSession) {
      throw new BadRequestException(
        errorPayload(
          'Upload session not found',
          'MATERIAL_UPLOAD_SESSION_NOT_FOUND',
        ),
      );
    }

    return uploadSession;
  }

  private ensureUploadSessionCanContinue(
    uploadSession: MaterialUploadSession,
  ): void {
    if (uploadSession.status === MaterialUploadSessionStatus.COMPLETED) {
      throw new BadRequestException(
        errorPayload(
          'Upload session already completed',
          'MATERIAL_UPLOAD_SESSION_COMPLETED',
        ),
      );
    }

    if (uploadSession.status === MaterialUploadSessionStatus.ABORTED) {
      throw new BadRequestException(
        errorPayload(
          'Upload session already aborted',
          'MATERIAL_UPLOAD_SESSION_ABORTED',
        ),
      );
    }

    if (uploadSession.status === MaterialUploadSessionStatus.FAILED) {
      throw new BadRequestException(
        errorPayload(
          'Upload session already failed',
          'MATERIAL_UPLOAD_SESSION_FAILED',
        ),
      );
    }

    if (uploadSession.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        errorPayload(
          'Upload session has expired',
          'MATERIAL_UPLOAD_SESSION_EXPIRED',
        ),
      );
    }
  }

  private ensureMaterialReady(
    material: Material,
    message: string,
    code: string,
  ): void {
    if (
      material.status !== MaterialStatus.READY ||
      !material.bucket ||
      !material.objectKey
    ) {
      throw new BadRequestException(errorPayload(message, code));
    }
  }

  private async removeMaterialAsset(material: Material): Promise<void> {
    if (material.objectKey) {
      await this.s3StorageService.deleteObject({
        bucket: material.bucket,
        objectKey: material.objectKey,
      });
    }
  }
}
