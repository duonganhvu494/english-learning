import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import {
  Material,
  MaterialStatus,
} from 'src/materials/entities/material.entity';
import { StorageDownloadTarget } from 'src/storage/interfaces/storage-download-target.interface';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { AccountType, User } from 'src/users/entities/user.entity';
import {
  AssignmentEntity,
  AssignmentType,
} from './entities/assignment.entity';
import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from './entities/assignment-quiz-attempt.entity';
import { AssignmentQuizAttemptAnswerEntity } from './entities/assignment-quiz-attempt-answer.entity';
import { AssignmentQuizOptionEntity } from './entities/assignment-quiz-option.entity';
import {
  AssignmentQuizQuestionEntity,
  AssignmentQuizQuestionType,
} from './entities/assignment-quiz-question.entity';
import { AssignmentQuizAttemptResponseDto } from './dto/assignment-quiz-attempt-response.dto';
import { AssignmentQuizManagementResponseDto } from './dto/assignment-quiz-management-response.dto';
import { AssignmentQuizQuestionManagementResponseDto } from './dto/assignment-quiz-question-management-response.dto';
import { AssignmentQuizResponseDto } from './dto/assignment-quiz-response.dto';
import { CreateAssignmentQuizOptionDto } from './dto/create-assignment-quiz-option.dto';
import { CreateAssignmentQuizQuestionDto } from './dto/create-assignment-quiz-question.dto';
import { SubmitAssignmentQuizAttemptDto } from './dto/submit-assignment-quiz-attempt.dto';
import { UpdateAssignmentQuizOptionDto } from './dto/update-assignment-quiz-option.dto';
import { UpdateAssignmentQuizQuestionDto } from './dto/update-assignment-quiz-question.dto';
import { errorPayload } from 'src/common/utils/error-payload.util';
import {
  AssignmentStatus,
  resolveAssignmentStatus,
} from './utils/assignment-window.util';

@Injectable()
export class AssignmentsQuizService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(AssignmentQuizQuestionEntity)
    private readonly questionRepo: Repository<AssignmentQuizQuestionEntity>,

    @InjectRepository(AssignmentQuizOptionEntity)
    private readonly optionRepo: Repository<AssignmentQuizOptionEntity>,

    @InjectRepository(AssignmentQuizAttemptEntity)
    private readonly attemptRepo: Repository<AssignmentQuizAttemptEntity>,

    @InjectRepository(AssignmentQuizAttemptAnswerEntity)
    private readonly attemptAnswerRepo: Repository<AssignmentQuizAttemptAnswerEntity>,

    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly s3StorageService: S3StorageService,
  ) {}

  async getQuizManagement(
    assignmentId: string,
  ): Promise<AssignmentQuizManagementResponseDto> {
    const assignment = await this.loadQuizAssignmentOrThrow(assignmentId);
    return AssignmentQuizManagementResponseDto.fromEntity(assignment);
  }

  async getQuiz(assignmentId: string): Promise<AssignmentQuizResponseDto> {
    const assignment = await this.loadQuizAssignmentOrThrow(assignmentId);
    this.ensureQuizReadyForStudents(assignment);
    return AssignmentQuizResponseDto.fromEntity(assignment);
  }

  async createQuizQuestion(
    assignmentId: string,
    dto: CreateAssignmentQuizQuestionDto,
  ): Promise<AssignmentQuizQuestionManagementResponseDto> {
    const assignment = await this.loadQuizAssignmentOrThrow(assignmentId, true);
    await this.assertQuizMutable(assignmentId);

    const material = await this.resolveQuestionMaterial(
      dto.materialId,
      assignment.session.classEntity.workspace.id,
    );
    const sortOrder =
      dto.sortOrder ?? (await this.questionRepo.count({
        where: { assignment: { id: assignmentId } },
      }));

    const question = await this.questionRepo.save(
      this.questionRepo.create({
        assignment,
        content: this.normalizeQuestionContent(dto.content),
        type: AssignmentQuizQuestionType.SINGLE_CHOICE,
        points: dto.points ?? 1,
        sortOrder,
        material,
      }),
    );

    return this.getQuizQuestionManagement(assignmentId, question.id);
  }

  async updateQuizQuestion(
    assignmentId: string,
    questionId: string,
    dto: UpdateAssignmentQuizQuestionDto,
  ): Promise<AssignmentQuizQuestionManagementResponseDto> {
    await this.assertQuizMutable(assignmentId);
    const question = await this.loadQuizQuestionOrThrow(assignmentId, questionId);

    if (dto.content !== undefined) {
      question.content = this.normalizeQuestionContent(dto.content);
    }

    if (dto.points !== undefined) {
      if (dto.points < 0) {
        throw new BadRequestException(
          errorPayload(
            'points must be greater than or equal to 0',
            'ASSIGNMENT_QUIZ_QUESTION_POINTS_INVALID',
          ),
        );
      }
      question.points = dto.points;
    }

    if (dto.sortOrder !== undefined) {
      question.sortOrder = dto.sortOrder;
    }

    if (dto.materialId !== undefined) {
      question.material = await this.resolveQuestionMaterial(
        dto.materialId,
        question.assignment.session.classEntity.workspace.id,
      );
    }

    await this.questionRepo.save(question);
    return this.getQuizQuestionManagement(assignmentId, question.id);
  }

  async deleteQuizQuestion(
    assignmentId: string,
    questionId: string,
  ): Promise<{ questionId: string }> {
    await this.assertQuizMutable(assignmentId);
    await this.loadQuizQuestionOrThrow(assignmentId, questionId);
    await this.questionRepo.delete(questionId);
    return { questionId };
  }

  async createQuizOption(
    assignmentId: string,
    questionId: string,
    dto: CreateAssignmentQuizOptionDto,
  ): Promise<AssignmentQuizQuestionManagementResponseDto> {
    await this.assertQuizMutable(assignmentId);
    const question = await this.loadQuizQuestionOrThrow(assignmentId, questionId);

    if (dto.isCorrect) {
      await this.clearCorrectOptions(question.id);
    }

    const sortOrder =
      dto.sortOrder ?? (await this.optionRepo.count({
        where: { question: { id: question.id } },
      }));

    await this.optionRepo.save(
      this.optionRepo.create({
        question,
        content: this.normalizeOptionContent(dto.content),
        isCorrect: dto.isCorrect ?? false,
        sortOrder,
      }),
    );

    return this.getQuizQuestionManagement(assignmentId, question.id);
  }

  async updateQuizOption(
    assignmentId: string,
    optionId: string,
    dto: UpdateAssignmentQuizOptionDto,
  ): Promise<AssignmentQuizQuestionManagementResponseDto> {
    await this.assertQuizMutable(assignmentId);
    const option = await this.loadQuizOptionOrThrow(assignmentId, optionId);

    if (dto.content !== undefined) {
      option.content = this.normalizeOptionContent(dto.content);
    }

    if (dto.sortOrder !== undefined) {
      option.sortOrder = dto.sortOrder;
    }

    if (dto.isCorrect !== undefined) {
      if (dto.isCorrect) {
        await this.clearCorrectOptions(option.question.id);
      }
      option.isCorrect = dto.isCorrect;
    }

    await this.optionRepo.save(option);
    return this.getQuizQuestionManagement(assignmentId, option.question.id);
  }

  async deleteQuizOption(
    assignmentId: string,
    optionId: string,
  ): Promise<{ optionId: string }> {
    await this.assertQuizMutable(assignmentId);
    await this.loadQuizOptionOrThrow(assignmentId, optionId);
    await this.optionRepo.delete(optionId);
    return { optionId };
  }

  async getQuizQuestionMaterialDownloadTarget(
    assignmentId: string,
    questionId: string,
    materialId: string,
  ): Promise<StorageDownloadTarget> {
    const question = await this.questionRepo.findOne({
      where: {
        id: questionId,
        assignment: { id: assignmentId },
        material: { id: materialId },
      },
      relations: {
        material: true,
      },
    });
    if (!question?.material) {
      throw new BadRequestException(
        errorPayload(
          'Material is not attached to this quiz question',
          'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_ATTACHED',
        ),
      );
    }
    this.ensureMaterialReady(
      question.material,
      'Quiz question material is not ready for download',
      'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_READY',
    );

    return {
      type: 'remote',
      url: await this.s3StorageService.createSignedDownloadUrl({
        bucket: question.material.bucket,
        objectKey: question.material.objectKey,
        fileName: question.material.fileName,
      }),
    };
  }

  async startMyQuizAttempt(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentQuizAttemptResponseDto> {
    const { assignment, student } = await this.loadStudentQuizContextOrThrow(
      assignmentId,
      studentId,
      true,
      true,
    );

    let attempt = await this.loadQuizAttempt(assignmentId, studentId);
    if (!attempt) {
      attempt = await this.attemptRepo.save(
        this.attemptRepo.create({
          assignment,
          student,
          status: AssignmentQuizAttemptStatus.IN_PROGRESS,
          startedAt: new Date(),
          submittedAt: null,
          score: null,
          maxScore: this.computeMaxScore(assignment),
          correctCount: 0,
          totalQuestions: assignment.quizQuestions.length,
        }),
      );
      attempt = await this.loadQuizAttemptOrThrow(assignmentId, studentId);
    }

    return AssignmentQuizAttemptResponseDto.fromEntity(attempt);
  }

  async getMyQuizAttempt(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentQuizAttemptResponseDto> {
    await this.loadStudentQuizContextOrThrow(
      assignmentId,
      studentId,
      false,
      true,
    );
    const attempt = await this.loadQuizAttempt(assignmentId, studentId);
    if (!attempt) {
      return AssignmentQuizAttemptResponseDto.empty({ assignmentId, studentId });
    }

    return AssignmentQuizAttemptResponseDto.fromEntity(attempt);
  }

  async submitMyQuizAttempt(
    assignmentId: string,
    studentId: string,
    dto: SubmitAssignmentQuizAttemptDto,
  ): Promise<AssignmentQuizAttemptResponseDto> {
    const { assignment, student } = await this.loadStudentQuizContextOrThrow(
      assignmentId,
      studentId,
      true,
      true,
    );

    const questions = [...assignment.quizQuestions].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    if (dto.answers.length !== questions.length) {
      throw new BadRequestException(
        errorPayload(
          'answers must include exactly one answer per question',
          'ASSIGNMENT_QUIZ_ANSWERS_COUNT_INVALID',
        ),
      );
    }

    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const attemptAnswers = dto.answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(
          errorPayload(
            'answers contain a question that does not belong to this quiz',
            'ASSIGNMENT_QUIZ_QUESTION_MISMATCH',
          ),
        );
      }

      const selectedOption = (question.options ?? []).find(
        (option) => option.id === answer.selectedOptionId,
      );
      if (!selectedOption) {
        throw new BadRequestException(
          errorPayload(
            'answers contain an option that does not belong to its question',
            'ASSIGNMENT_QUIZ_OPTION_MISMATCH',
          ),
        );
      }

      const isCorrect = selectedOption.isCorrect;
      return {
        question,
        selectedOption,
        isCorrect,
        awardedPoints: isCorrect ? question.points : 0,
      };
    });

    let attempt = await this.loadQuizAttempt(assignmentId, studentId);
    if (attempt?.status === AssignmentQuizAttemptStatus.SUBMITTED) {
      throw new BadRequestException(
        errorPayload(
          'Quiz attempt was already submitted',
          'ASSIGNMENT_QUIZ_ATTEMPT_ALREADY_SUBMITTED',
        ),
      );
    }

    if (!attempt) {
      attempt = this.attemptRepo.create({
        assignment,
        student,
        status: AssignmentQuizAttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        submittedAt: null,
        score: null,
        maxScore: this.computeMaxScore(assignment),
        correctCount: 0,
        totalQuestions: questions.length,
      });
      attempt = await this.attemptRepo.save(attempt);
    }

    const score = attemptAnswers.reduce(
      (sum, answer) => sum + answer.awardedPoints,
      0,
    );
    const correctCount = attemptAnswers.filter((answer) => answer.isCorrect).length;
    attempt.status = AssignmentQuizAttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.score = score;
    attempt.maxScore = this.computeMaxScore(assignment);
    attempt.correctCount = correctCount;
    attempt.totalQuestions = questions.length;

    await this.attemptRepo.manager.transaction(async (manager) => {
      await manager.getRepository(AssignmentQuizAttemptEntity).save(attempt);
      await manager.getRepository(AssignmentQuizAttemptAnswerEntity).delete({
        attempt: { id: attempt.id },
      });
      await manager.getRepository(AssignmentQuizAttemptAnswerEntity).save(
        attemptAnswers.map((answer) =>
          manager.getRepository(AssignmentQuizAttemptAnswerEntity).create({
            attempt,
            question: answer.question,
            selectedOption: answer.selectedOption,
            isCorrect: answer.isCorrect,
            awardedPoints: answer.awardedPoints,
          }),
        ),
      );
    });

    const savedAttempt = await this.loadQuizAttemptOrThrow(assignmentId, studentId);
    return AssignmentQuizAttemptResponseDto.fromEntity(savedAttempt);
  }

  async listQuizAttempts(
    assignmentId: string,
  ): Promise<AssignmentQuizAttemptResponseDto[]> {
    const assignment = await this.loadQuizAssignmentOrThrow(assignmentId, true);
    const [classStudents, attempts] = await Promise.all([
      this.classStudentRepo.find({
        where: {
          classEntity: { id: assignment.session.classEntity.id },
        },
        relations: {
          student: true,
        },
      }),
      this.attemptRepo.find({
        where: {
          assignment: { id: assignmentId },
        },
        relations: {
          assignment: true,
          student: true,
          answers: {
            question: true,
            selectedOption: true,
          },
        },
      }),
    ]);

    const attemptMap = new Map(
      attempts.map((attempt) => [attempt.student.id, attempt]),
    );

    return classStudents
      .filter(
        (classStudent) => classStudent.student.accountType === AccountType.STUDENT,
      )
      .map((classStudent) => {
        const attempt = attemptMap.get(classStudent.student.id);
        if (!attempt) {
          return AssignmentQuizAttemptResponseDto.empty({
            assignmentId,
            studentId: classStudent.student.id,
          });
        }

        return AssignmentQuizAttemptResponseDto.fromEntity(attempt);
      });
  }

  async getQuizAttempt(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentQuizAttemptResponseDto> {
    const assignment = await this.loadQuizAssignmentOrThrow(assignmentId, true);
    const classStudent = await this.loadStudentMembershipOrThrow(
      assignment,
      studentId,
    );
    const attempt = await this.loadQuizAttempt(assignmentId, classStudent.student.id);
    if (!attempt) {
      return AssignmentQuizAttemptResponseDto.empty({
        assignmentId,
        studentId: classStudent.student.id,
      });
    }

    return AssignmentQuizAttemptResponseDto.fromEntity(attempt);
  }

  private async getQuizQuestionManagement(
    assignmentId: string,
    questionId: string,
  ): Promise<AssignmentQuizQuestionManagementResponseDto> {
    const question = await this.questionRepo.findOne({
      where: {
        id: questionId,
        assignment: { id: assignmentId },
      },
      relations: {
        material: true,
        options: true,
      },
    });
    if (!question) {
      throw new BadRequestException(
        errorPayload(
          'Quiz question not found',
          'ASSIGNMENT_QUIZ_QUESTION_NOT_FOUND',
        ),
      );
    }

    return AssignmentQuizQuestionManagementResponseDto.fromEntity(
      question,
      assignmentId,
    );
  }

  private async loadQuizAssignmentOrThrow(
    assignmentId: string,
    includeSessionWorkspace = false,
  ): Promise<AssignmentEntity> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: {
        session: includeSessionWorkspace
          ? {
              classEntity: {
                workspace: true,
              },
            }
          : {
              classEntity: true,
            },
        quizQuestions: {
          material: true,
          options: true,
        },
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        errorPayload('Assignment not found', 'ASSIGNMENT_NOT_FOUND'),
      );
    }

    if (assignment.type !== AssignmentType.QUIZ) {
      throw new BadRequestException(
        errorPayload(
          'Assignment is not a quiz',
          'ASSIGNMENT_QUIZ_TYPE_REQUIRED',
        ),
      );
    }

    return assignment;
  }

  private async loadQuizQuestionOrThrow(
    assignmentId: string,
    questionId: string,
  ): Promise<AssignmentQuizQuestionEntity> {
    const question = await this.questionRepo.findOne({
      where: {
        id: questionId,
        assignment: { id: assignmentId },
      },
      relations: {
        assignment: {
          session: {
            classEntity: {
              workspace: true,
            },
          },
        },
        material: true,
        options: true,
      },
    });
    if (!question) {
      throw new BadRequestException(
        errorPayload(
          'Quiz question not found',
          'ASSIGNMENT_QUIZ_QUESTION_NOT_FOUND',
        ),
      );
    }

    return question;
  }

  private async loadQuizOptionOrThrow(
    assignmentId: string,
    optionId: string,
  ): Promise<AssignmentQuizOptionEntity> {
    const option = await this.optionRepo.findOne({
      where: {
        id: optionId,
        question: {
          assignment: { id: assignmentId },
        },
      },
      relations: {
        question: {
          assignment: {
            session: {
              classEntity: {
                workspace: true,
              },
            },
          },
        },
      },
    });
    if (!option) {
      throw new BadRequestException(
        errorPayload(
          'Quiz option not found',
          'ASSIGNMENT_QUIZ_OPTION_NOT_FOUND',
        ),
      );
    }

    return option;
  }

  private async resolveQuestionMaterial(
    materialId: string | null | undefined,
    workspaceId: string,
  ): Promise<Material | null> {
    if (materialId === undefined) {
      return null;
    }

    if (materialId === null) {
      return null;
    }

    const material = await this.materialRepo.findOne({
      where: {
        id: materialId,
        workspace: { id: workspaceId },
      },
    });
    if (!material) {
      throw new BadRequestException(
        errorPayload(
          'Question material was not found in this workspace',
          'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_FOUND',
        ),
      );
    }

    this.ensureMaterialReady(
      material,
      'Question material is not ready to use',
      'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_READY',
    );
    return material;
  }

  private async assertQuizMutable(assignmentId: string): Promise<void> {
    const attemptCount = await this.attemptRepo.count({
      where: {
        assignment: { id: assignmentId },
      },
    });
    if (attemptCount > 0) {
      throw new BadRequestException(
        errorPayload(
          'Cannot modify quiz after students have started attempting it',
          'ASSIGNMENT_QUIZ_ALREADY_STARTED',
        ),
      );
    }
  }

  private async clearCorrectOptions(questionId: string): Promise<void> {
    await this.optionRepo
      .createQueryBuilder()
      .update(AssignmentQuizOptionEntity)
      .set({ isCorrect: false })
      .where('"questionId" = :questionId', { questionId })
      .execute();
  }

  private async loadStudentQuizContextOrThrow(
    assignmentId: string,
    studentId: string,
    enforceDeadline: boolean,
    requireReady: boolean,
  ): Promise<{ assignment: AssignmentEntity; student: User }> {
    const assignment = await this.loadQuizAssignmentOrThrow(assignmentId, true);
    const classStudent = await this.loadStudentMembershipOrThrow(
      assignment,
      studentId,
    );
    if (enforceDeadline) {
      const status = resolveAssignmentStatus(assignment);
      if (status === AssignmentStatus.UPCOMING) {
        throw new BadRequestException(
          errorPayload(
            'Assignment quiz has not opened yet',
            'ASSIGNMENT_QUIZ_NOT_OPEN_YET',
          ),
        );
      }

      if (status === AssignmentStatus.CLOSED) {
        throw new BadRequestException(
          errorPayload(
            'Assignment quiz window has closed',
            'ASSIGNMENT_QUIZ_CLOSED',
          ),
        );
      }
    }

    if (requireReady) {
      this.ensureQuizReadyForStudents(assignment);
    }

    return {
      assignment,
      student: classStudent.student,
    };
  }

  private async loadStudentMembershipOrThrow(
    assignment: AssignmentEntity,
    studentId: string,
  ): Promise<ClassStudent> {
    const classStudent = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: assignment.session.classEntity.id },
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
          'ASSIGNMENT_QUIZ_CLASS_MEMBERSHIP_REQUIRED',
        ),
      );
    }

    if (classStudent.student.accountType !== AccountType.STUDENT) {
      throw new ForbiddenException(
        errorPayload(
          'Only students can take assignment quizzes',
          'ASSIGNMENT_QUIZ_STUDENT_ROLE_REQUIRED',
        ),
      );
    }

    return classStudent;
  }

  private ensureQuizReadyForStudents(assignment: AssignmentEntity): void {
    const questions = assignment.quizQuestions ?? [];
    if (questions.length === 0) {
      throw new BadRequestException(
        errorPayload('Quiz is not ready yet', 'ASSIGNMENT_QUIZ_NOT_READY'),
      );
    }

    questions.forEach((question) => {
      if (question.type !== AssignmentQuizQuestionType.SINGLE_CHOICE) {
        throw new BadRequestException(
          errorPayload(
            'Quiz contains unsupported question type',
            'ASSIGNMENT_QUIZ_QUESTION_TYPE_UNSUPPORTED',
          ),
        );
      }

      if (question.material) {
        this.ensureMaterialReady(
          question.material,
          'Quiz question material is not ready to use',
          'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_READY',
        );
      }

      const options = question.options ?? [];
      if (options.length < 2) {
        throw new BadRequestException(
          errorPayload('Quiz is not ready yet', 'ASSIGNMENT_QUIZ_NOT_READY'),
        );
      }

      const correctOptionCount = options.filter((option) => option.isCorrect).length;
      if (correctOptionCount !== 1) {
        throw new BadRequestException(
          errorPayload('Quiz is not ready yet', 'ASSIGNMENT_QUIZ_NOT_READY'),
        );
      }
    });
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

  private computeMaxScore(assignment: AssignmentEntity): number {
    return (assignment.quizQuestions ?? []).reduce(
      (sum, question) => sum + question.points,
      0,
    );
  }

  private async loadQuizAttempt(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentQuizAttemptEntity | null> {
    return this.attemptRepo.findOne({
      where: {
        assignment: { id: assignmentId },
        student: { id: studentId },
      },
      relations: {
        assignment: true,
        student: true,
        answers: {
          question: true,
          selectedOption: true,
        },
      },
    });
  }

  private async loadQuizAttemptOrThrow(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentQuizAttemptEntity> {
    const attempt = await this.loadQuizAttempt(assignmentId, studentId);
    if (!attempt) {
      throw new BadRequestException(
        errorPayload(
          'Quiz attempt not found',
          'ASSIGNMENT_QUIZ_ATTEMPT_NOT_FOUND',
        ),
      );
    }

    return attempt;
  }

  private normalizeQuestionContent(content: string): string {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException(
        errorPayload(
          'content can not be empty',
          'ASSIGNMENT_QUIZ_QUESTION_CONTENT_REQUIRED',
        ),
      );
    }

    return normalizedContent;
  }

  private normalizeOptionContent(content: string): string {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException(
        errorPayload(
          'content can not be empty',
          'ASSIGNMENT_QUIZ_OPTION_CONTENT_REQUIRED',
        ),
      );
    }

    return normalizedContent;
  }
}
