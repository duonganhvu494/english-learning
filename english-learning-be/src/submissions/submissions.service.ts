import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssignmentEntity,
  AssignmentType,
} from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { AbortMaterialUploadDto } from 'src/materials/dto/abort-material-upload.dto';
import { CompleteMaterialUploadDto } from 'src/materials/dto/complete-material-upload.dto';
import { MaterialUploadAbortResponseDto } from 'src/materials/dto/material-upload-abort-response.dto';
import { MaterialUploadInitResponseDto } from 'src/materials/dto/material-upload-init-response.dto';
import { MaterialUploadPartSignedResponseDto } from 'src/materials/dto/material-upload-part-signed-response.dto';
import { SignMaterialUploadPartDto } from 'src/materials/dto/sign-material-upload-part.dto';
import {
  Material,
  MaterialCategory,
  MaterialStatus,
} from 'src/materials/entities/material.entity';
import {
  MaterialUploadSession,
  MaterialUploadSessionStatus,
} from 'src/materials/entities/material-upload-session.entity';
import { StorageDownloadTarget } from 'src/storage/interfaces/storage-download-target.interface';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { validateMultipartUploadRequest } from 'src/storage/utils/storage-upload-validation.util';
import { AccountType, User } from 'src/users/entities/user.entity';
import { InitSubmissionUploadDto } from './dto/init-submission-upload.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { SubmissionEntity } from './entities/submission.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { resolveAssignmentStatus, AssignmentStatus } from 'src/assignments/utils/assignment-window.util';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,

    @InjectRepository(MaterialUploadSession)
    private readonly uploadSessionRepo: Repository<MaterialUploadSession>,

    private readonly s3StorageService: S3StorageService,
  ) {}

  async initMySubmissionUpload(
    assignmentId: string,
    studentId: string,
    dto: InitSubmissionUploadDto,
  ): Promise<MaterialUploadInitResponseDto> {
    const { assignment, student } = await this.loadStudentSubmissionContextOrThrow(
      assignmentId,
      studentId,
      true,
    );

    const fileName = dto.fileName.trim();
    if (!fileName) {
      throw new BadRequestException(
        errorPayload(
          'fileName can not be empty',
          'SUBMISSION_FILE_NAME_REQUIRED',
        ),
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
      workspaceId: assignment.session.classEntity.workspace.id,
      category: MaterialCategory.SUBMISSION,
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
        workspace: assignment.session.classEntity.workspace,
        title: this.buildSubmissionMaterialTitle(assignment, student),
        status: MaterialStatus.PENDING,
        bucket,
        objectKey,
        fileName,
        mimeType,
        size: dto.size,
        category: MaterialCategory.SUBMISSION,
        uploadedBy: student,
      }),
    );

    const uploadSession = await this.uploadSessionRepo.save(
      this.uploadSessionRepo.create({
        material: savedMaterial,
        workspace: assignment.session.classEntity.workspace,
        assignment,
        uploadedBy: student,
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

  async signMySubmissionUploadPart(
    assignmentId: string,
    studentId: string,
    dto: SignMaterialUploadPartDto,
  ): Promise<MaterialUploadPartSignedResponseDto> {
    const { assignment } = await this.loadStudentSubmissionContextOrThrow(
      assignmentId,
      studentId,
      true,
    );
    const uploadSession = await this.loadSubmissionUploadSessionOrThrow({
      assignmentId,
      studentId,
      workspaceId: assignment.session.classEntity.workspace.id,
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
          'SUBMISSION_UPLOAD_PART_NUMBER_OUT_OF_RANGE',
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

  async completeMySubmissionUpload(
    assignmentId: string,
    studentId: string,
    dto: CompleteMaterialUploadDto,
  ): Promise<SubmissionResponseDto> {
    const { assignment, student } = await this.loadStudentSubmissionContextOrThrow(
      assignmentId,
      studentId,
      true,
    );
    const uploadSession = await this.loadSubmissionUploadSessionOrThrow({
      assignmentId,
      studentId,
      workspaceId: assignment.session.classEntity.workspace.id,
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
          'SUBMISSION_UPLOAD_PARTS_COUNT_MISMATCH',
        ),
      );
    }
    sortedParts.forEach((part, index) => {
      if (part.partNumber !== index + 1) {
        throw new BadRequestException(
          errorPayload(
            'parts must be sequential from 1',
            'SUBMISSION_UPLOAD_PARTS_NOT_SEQUENTIAL',
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

    const existingSubmission = await this.loadSubmission(assignmentId, studentId);
    const submission = existingSubmission
      ? existingSubmission
      : this.submissionRepo.create({
          assignment,
          student,
        });

    const previousMaterial = existingSubmission?.material ?? null;
    uploadSession.status = MaterialUploadSessionStatus.COMPLETED;
    uploadSession.completedAt = new Date();
    uploadSession.material.status = MaterialStatus.READY;

    submission.material = uploadSession.material;
    submission.submittedAt = new Date();
    submission.grade = null;
    submission.feedback = null;

    await this.submissionRepo.manager.transaction(async (manager) => {
      await manager.getRepository(MaterialUploadSession).save(uploadSession);
      await manager.getRepository(Material).save(uploadSession.material);
      await manager.getRepository(SubmissionEntity).save(submission);
    });

    const hydratedSubmission = await this.loadSubmissionOrThrow(
      assignmentId,
      studentId,
    );

    if (previousMaterial && previousMaterial.id !== uploadSession.material.id) {
      this.cleanupMaterial(previousMaterial).catch(() => undefined);
    }

    return SubmissionResponseDto.fromEntity(
      hydratedSubmission,
      this.buildSelfDownloadUrl(assignmentId),
    );
  }

  async abortMySubmissionUpload(
    assignmentId: string,
    studentId: string,
    dto: AbortMaterialUploadDto,
  ): Promise<MaterialUploadAbortResponseDto> {
    const { assignment } = await this.loadStudentSubmissionContextOrThrow(
      assignmentId,
      studentId,
      false,
    );
    const uploadSession = await this.loadSubmissionUploadSessionOrThrow({
      assignmentId,
      studentId,
      workspaceId: assignment.session.classEntity.workspace.id,
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
    uploadSession.material.status = MaterialStatus.FAILED;

    await this.submissionRepo.manager.transaction(async (manager) => {
      await manager.getRepository(MaterialUploadSession).save(uploadSession);
      await manager.getRepository(Material).save(uploadSession.material);
    });

    return MaterialUploadAbortResponseDto.fromData({
      materialId: uploadSession.material.id,
      uploadSessionId: uploadSession.id,
      status: uploadSession.status,
    });
  }

  async getMySubmission(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionResponseDto> {
    const assignment = await this.loadAssignmentOrThrow(assignmentId);
    const classStudent = await this.loadStudentMembershipOrThrow(
      assignment,
      studentId,
    );

    const submission = await this.loadSubmission(assignmentId, studentId);
    if (!submission) {
      return SubmissionResponseDto.empty({
        assignmentId,
        student: classStudent.student,
      });
    }

    return SubmissionResponseDto.fromEntity(
      submission,
      this.buildSelfDownloadUrl(assignmentId),
    );
  }

  async listAssignmentSubmissions(
    assignmentId: string,
  ): Promise<SubmissionResponseDto[]> {
    const assignment = await this.loadAssignmentOrThrow(assignmentId);
    const [classStudents, submissions] = await Promise.all([
      this.classStudentRepo.find({
        where: {
          classEntity: { id: assignment.session.classEntity.id },
        },
        relations: {
          student: true,
        },
      }),
      this.submissionRepo.find({
        where: {
          assignment: { id: assignmentId },
        },
        relations: {
          assignment: true,
          student: true,
          material: true,
        },
      }),
    ]);

    const submissionMap = new Map(
      submissions.map((submission) => [submission.student.id, submission]),
    );

    return [...classStudents]
      .sort((a, b) =>
        this.resolveStudentName(a.student).localeCompare(
          this.resolveStudentName(b.student),
        ),
      )
      .map((classStudent) => {
        const submission = submissionMap.get(classStudent.student.id);
        if (!submission) {
          return SubmissionResponseDto.empty({
            assignmentId,
            student: classStudent.student,
          });
        }

        return SubmissionResponseDto.fromEntity(
          submission,
          this.buildTeacherDownloadUrl(assignmentId, classStudent.student.id),
        );
      });
  }

  async getAssignmentSubmission(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionResponseDto> {
    const assignment = await this.loadAssignmentOrThrow(assignmentId);
    const classStudent = await this.loadClassStudentOrThrow(
      assignment.session.classEntity.id,
      studentId,
    );
    const submission = await this.loadSubmission(assignmentId, studentId);
    if (!submission) {
      return SubmissionResponseDto.empty({
        assignmentId,
        student: classStudent.student,
      });
    }

    return SubmissionResponseDto.fromEntity(
      submission,
      this.buildTeacherDownloadUrl(assignmentId, studentId),
    );
  }

  async reviewSubmission(
    assignmentId: string,
    studentId: string,
    dto: ReviewSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    if (dto.grade === undefined && dto.feedback === undefined) {
      throw new BadRequestException(
        errorPayload(
          'At least one of grade or feedback must be provided',
          'SUBMISSION_REVIEW_EMPTY',
        ),
      );
    }

    const submission = await this.loadSubmissionOrThrow(assignmentId, studentId);

    if (dto.grade !== undefined) {
      submission.grade = dto.grade;
    }

    if (dto.feedback !== undefined) {
      submission.feedback = dto.feedback.trim() || null;
    }

    await this.submissionRepo.save(submission);
    const updatedSubmission = await this.loadSubmissionOrThrow(
      assignmentId,
      studentId,
    );

    return SubmissionResponseDto.fromEntity(
      updatedSubmission,
      this.buildTeacherDownloadUrl(assignmentId, studentId),
    );
  }

  async getMySubmissionDownloadTarget(
    assignmentId: string,
    studentId: string,
  ): Promise<StorageDownloadTarget> {
    const assignment = await this.loadAssignmentOrThrow(assignmentId);
    await this.loadStudentMembershipOrThrow(assignment, studentId);
    return this.getSubmissionDownloadTargetOrThrow(assignmentId, studentId);
  }

  async getSubmissionDownloadTarget(
    assignmentId: string,
    studentId: string,
  ): Promise<StorageDownloadTarget> {
    await this.loadAssignmentOrThrow(assignmentId);
    await this.loadClassStudentOrThrowByAssignment(assignmentId, studentId);
    return this.getSubmissionDownloadTargetOrThrow(assignmentId, studentId);
  }

  private async loadAssignmentOrThrow(
    assignmentId: string,
  ): Promise<AssignmentEntity> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: {
        session: {
          classEntity: {
            workspace: true,
          },
        },
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        errorPayload('Assignment not found', 'SUBMISSION_ASSIGNMENT_NOT_FOUND'),
      );
    }

    if (assignment.type !== AssignmentType.MANUAL) {
      throw new BadRequestException(
        errorPayload(
          'File submissions are only available for manual assignments',
          'SUBMISSION_MANUAL_ASSIGNMENT_REQUIRED',
        ),
      );
    }

    return assignment;
  }

  private async loadStudentMembershipOrThrow(
    assignment: AssignmentEntity,
    studentId: string,
  ): Promise<ClassStudent> {
    const classStudent = await this.loadClassStudentOrThrow(
      assignment.session.classEntity.id,
      studentId,
    );

    if (classStudent.student.accountType !== AccountType.STUDENT) {
      throw new ForbiddenException(
        errorPayload(
          'Only students can submit assignments',
          'SUBMISSION_STUDENT_ROLE_REQUIRED',
        ),
      );
    }

    return classStudent;
  }

  private async loadClassStudentOrThrowByAssignment(
    assignmentId: string,
    studentId: string,
  ): Promise<ClassStudent> {
    const assignment = await this.loadAssignmentOrThrow(assignmentId);
    return this.loadClassStudentOrThrow(assignment.session.classEntity.id, studentId);
  }

  private async loadClassStudentOrThrow(
    classId: string,
    studentId: string,
  ): Promise<ClassStudent> {
    const classStudent = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: classId },
        student: { id: studentId },
      },
      relations: {
        student: true,
      },
    });
    if (!classStudent) {
      throw new ForbiddenException(
        errorPayload(
          'Student does not belong to this class',
          'SUBMISSION_CLASS_MEMBERSHIP_REQUIRED',
        ),
      );
    }

    return classStudent;
  }

  private buildSubmissionMaterialTitle(
    assignment: AssignmentEntity,
    student: User,
  ): string {
    const studentLabel = this.resolveStudentName(student) || student.id;
    return `${assignment.title} - ${studentLabel}`.slice(0, 255);
  }

  private async loadSubmission(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionEntity | null> {
    return this.submissionRepo.findOne({
      where: {
        assignment: { id: assignmentId },
        student: { id: studentId },
      },
      relations: {
        assignment: true,
        student: true,
        material: true,
      },
    });
  }

  private async loadSubmissionOrThrow(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionEntity> {
    const submission = await this.loadSubmission(assignmentId, studentId);
    if (!submission) {
      throw new BadRequestException(
        errorPayload(
          'Student has not submitted this assignment yet',
          'SUBMISSION_NOT_FOUND',
        ),
      );
    }

    return submission;
  }

  private async getSubmissionDownloadTargetOrThrow(
    assignmentId: string,
    studentId: string,
  ): Promise<StorageDownloadTarget> {
    const submission = await this.loadSubmissionOrThrow(assignmentId, studentId);
    this.ensureMaterialReady(
      submission.material,
      'Submission material is not ready for download',
      'SUBMISSION_MATERIAL_NOT_READY',
    );

    return {
      type: 'remote',
      url: await this.s3StorageService.createSignedDownloadUrl({
        bucket: submission.material.bucket,
        objectKey: submission.material.objectKey,
        fileName: submission.material.fileName,
      }),
    };
  }

  private buildSelfDownloadUrl(assignmentId: string): string {
    return `/assignments/${assignmentId}/submissions/me/download`;
  }

  private buildTeacherDownloadUrl(
    assignmentId: string,
    studentId: string,
  ): string {
    return `/assignments/${assignmentId}/submissions/${studentId}/download`;
  }

  private resolveStudentName(student: User): string {
    return student.fullName || student.userName || student.email || student.id;
  }

  private async loadStudentSubmissionContextOrThrow(
    assignmentId: string,
    studentId: string,
    enforceDeadline: boolean,
  ): Promise<{ assignment: AssignmentEntity; student: User }> {
    const assignment = await this.loadAssignmentOrThrow(assignmentId);
    const classStudent = await this.loadStudentMembershipOrThrow(
      assignment,
      studentId,
    );
    if (enforceDeadline) {
      const status = resolveAssignmentStatus(assignment);
      if (status === AssignmentStatus.UPCOMING) {
        throw new BadRequestException(
          errorPayload(
            'Assignment submission has not opened yet',
            'SUBMISSION_NOT_OPEN_YET',
          ),
        );
      }

      if (status === AssignmentStatus.CLOSED) {
        throw new BadRequestException(
          errorPayload(
            'Assignment submission window has closed',
            'SUBMISSION_CLOSED',
          ),
        );
      }
    }

    return {
      assignment,
      student: classStudent.student,
    };
  }

  private async loadSubmissionUploadSessionOrThrow(input: {
    assignmentId: string;
    studentId: string;
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
        assignment: { id: input.assignmentId },
        uploadedBy: { id: input.studentId },
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
          'SUBMISSION_UPLOAD_SESSION_NOT_FOUND',
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
          'SUBMISSION_UPLOAD_SESSION_COMPLETED',
        ),
      );
    }

    if (uploadSession.status === MaterialUploadSessionStatus.ABORTED) {
      throw new BadRequestException(
        errorPayload(
          'Upload session already aborted',
          'SUBMISSION_UPLOAD_SESSION_ABORTED',
        ),
      );
    }

    if (uploadSession.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        errorPayload(
          'Upload session has expired',
          'SUBMISSION_UPLOAD_SESSION_EXPIRED',
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

  private async cleanupMaterial(material: Material): Promise<void> {
    await this.materialRepo.delete(material.id);
    if (material.objectKey) {
      await this.s3StorageService.deleteObject({
        bucket: material.bucket,
        objectKey: material.objectKey,
      }).catch(() => undefined);
    }
  }
}
