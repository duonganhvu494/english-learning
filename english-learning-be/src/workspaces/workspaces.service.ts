// src/workspaces/workspaces.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, MoreThan, Repository } from "typeorm";
import { Workspace } from "./entities/workspace.entity";
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from "./entities/workspace-member.entity";
import {
  WorkspaceSubscription,
  WorkspaceSubscriptionSource,
  WorkspaceSubscriptionStatus,
} from "./entities/workspace-subscription.entity";
import { PlansService } from "src/plans/plans.service";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { CreateStudentDto } from "src/users/dto/create-student.dto";
import { UpdateWorkspaceStudentDto } from "./dto/update-workspace-student.dto";
import { User, AccountType } from "src/users/entities/user.entity";
import { UserProfileResponse } from "src/users/dto/user-profile-response.dto";
import { WorkspaceDetailResponseDto } from "./dto/workspace-detail-response.dto";
import { WorkspaceResponseDto } from "./dto/workspace-response.dto";
import { WorkspaceStudentListItemDto } from "./dto/workspace-student-list-item.dto";
import { WorkspaceStudentResponseDto } from "./dto/workspace-student-response.dto";
import { RemoveWorkspaceStudentResponseDto } from "./dto/remove-workspace-student-response.dto";
import { Role } from "src/rbac/entities/role.entity";
import { WorkspaceAccessService } from "src/rbac/workspace-access.service";
import { ClassEntity } from "src/classes/entities/class.entity";
import { ClassStudent } from "src/classes/entities/class-student.entity";
import { errorPayload } from "src/common/utils/error-payload.util";
import { WorkspaceSubscriptionResponseDto } from "./dto/workspace-subscription-response.dto";
import { WorkspaceStudentsService } from "./workspace-students.service";
import {
  AssignmentEntity,
  AssignmentType,
} from "src/assignments/entities/assignment.entity";

import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from "src/assignments/entities/assignment-quiz-attempt.entity";

import { SubmissionEntity } from "src/submissions/entities/submission.entity";

import {
  StudentDetailResponseDto,
  StudentLearningResult,
} from "./dto/student-detail-response.dto";

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(WorkspaceSubscription)
    private readonly workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    @InjectRepository(AssignmentQuizAttemptEntity)
    private readonly quizAttemptRepo: Repository<AssignmentQuizAttemptEntity>,

    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly workspaceStudentsService: WorkspaceStudentsService,
    private readonly plansService: PlansService,
  ) {}

  private isUniqueConstraintViolation(
    error: unknown,
  ): error is { code: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    );
  }

  async createWorkspace(
    dto: CreateWorkspaceDto,
    userId: string,
  ): Promise<WorkspaceResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(
        errorPayload("User not found", "WORKSPACE_OWNER_NOT_FOUND"),
      );
    }

    if (user.accountType !== AccountType.TEACHER) {
      throw new ForbiddenException(
        errorPayload(
          "Only teacher account can create workspace",
          "WORKSPACE_CREATE_TEACHER_ONLY",
        ),
      );
    }

    const existedWorkspace = await this.workspaceRepo.findOne({
      where: {
        owner: { id: userId },
      },
    });

    if (existedWorkspace) {
      throw new BadRequestException(
        errorPayload(
          "Each teacher can own only one workspace",
          "WORKSPACE_OWNER_ALREADY_HAS_WORKSPACE",
        ),
      );
    }

    const ownerRole = await this.roleRepo.findOne({
      where: {
        name: "owner",
        isSystem: true,
        workspaceId: IsNull(),
      },
    });
    if (!ownerRole) {
      throw new BadRequestException(
        errorPayload("Owner role not found", "WORKSPACE_OWNER_ROLE_NOT_FOUND"),
      );
    }

    const defaultPlan = await this.plansService.getDefaultPlan();

    const normalizedWorkspaceName = dto.name.trim();

    const workspace = this.workspaceRepo.create({
      name: normalizedWorkspaceName,
      owner: user,
      isActive: true,
    });

    let savedWorkspace: Workspace;
    try {
      savedWorkspace = await this.workspaceRepo.save(workspace);
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          errorPayload(
            "Each teacher can own only one workspace",
            "WORKSPACE_OWNER_ALREADY_HAS_WORKSPACE",
          ),
        );
      }

      throw error;
    }

    const member = this.memberRepo.create({
      workspace: savedWorkspace,
      user,
      role: ownerRole,
    });

    await this.memberRepo.save(member);

    const startedAt = new Date();

    const subscription = this.workspaceSubscriptionRepo.create({
      workspace: savedWorkspace,
      plan: defaultPlan,
      status: WorkspaceSubscriptionStatus.ACTIVE,
      startedAt,
      endedAt: null,
      trialEndsAt: null,
      cancelledAt: null,
      source: WorkspaceSubscriptionSource.WORKSPACE_CREATION,
      paymentTransactionId: null,
      note: `Assigned ${defaultPlan.code} plan on workspace creation`,
    });
    await this.workspaceSubscriptionRepo.save(subscription);

    return WorkspaceResponseDto.fromEntity(savedWorkspace);
  }

  async getWorkspaceDetail(
    workspaceId: string,
    actorUserId: string,
  ): Promise<WorkspaceDetailResponseDto> {
    const [workspace, viewerMembership, actorUser, studentCount, classCount] =
      await Promise.all([
        this.workspaceRepo.findOne({
          where: { id: workspaceId },
          relations: {
            owner: true,
          },
        }),
        this.memberRepo.findOne({
          where: {
            workspace: { id: workspaceId },
            user: { id: actorUserId },
            status: WorkspaceMemberStatus.ACTIVE,
          },
          relations: {
            role: true,
          },
        }),
        this.userRepo.findOne({
          where: { id: actorUserId },
        }),
        this.memberRepo
          .createQueryBuilder("member")
          .innerJoin("member.user", "user")
          .innerJoin("member.workspace", "workspace")
          .where("workspace.id = :workspaceId", { workspaceId })
          .andWhere("member.status = :status", {
            status: WorkspaceMemberStatus.ACTIVE,
          })
          .andWhere("user.accountType = :accountType", {
            accountType: AccountType.STUDENT,
          })
          .getCount(),
        this.classRepo.count({
          where: {
            workspace: { id: workspaceId },
          },
        }),
      ]);

    if (!workspace) {
      throw new BadRequestException(
        errorPayload("Workspace not found", "WORKSPACE_NOT_FOUND"),
      );
    }

    return WorkspaceDetailResponseDto.fromData({
      workspace,
      currentUserRole:
        viewerMembership?.role.name ??
        (actorUser?.isSuperAdmin ? "owner" : "unknown"),
      studentCount,
      classCount,
    });
  }

  async createStudentInWorkspace(
    workspaceId: string,
    dto: CreateStudentDto,
  ): Promise<WorkspaceStudentResponseDto> {
    const workspace =
      await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const createdStudent =
      await this.workspaceStudentsService.provisionWorkspaceStudent(
        workspace,
        dto,
      );

    return WorkspaceStudentResponseDto.fromData({
      workspaceId: workspace.id,
      mode: createdStudent.mode,
      role: createdStudent.workspaceRole.name,
      user: UserProfileResponse.fromEntity(createdStudent.user),
    });
  }

  async listWorkspaceStudents(
    workspaceId: string,
  ): Promise<WorkspaceStudentListItemDto[]> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const members = await this.memberRepo
      .createQueryBuilder("member")
      .innerJoinAndSelect("member.user", "user")
      .innerJoinAndSelect("member.role", "role")
      .innerJoin("member.workspace", "workspace")
      .where("workspace.id = :workspaceId", { workspaceId })
      .andWhere("member.status = :status", {
        status: WorkspaceMemberStatus.ACTIVE,
      })
      .andWhere("user.accountType = :accountType", {
        accountType: AccountType.STUDENT,
      })
      .orderBy("user.fullName", "ASC")
      .getMany();

    return members.map((member) =>
      WorkspaceStudentListItemDto.fromEntity(member),
    );
  }

  async updateWorkspaceStudent(
    workspaceId: string,
    studentId: string,
    dto: UpdateWorkspaceStudentDto,
  ): Promise<WorkspaceStudentListItemDto> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const member = await this.memberRepo.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: studentId, accountType: AccountType.STUDENT },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: {
        user: true,
        role: true,
      },
    });
    if (!member) {
      throw new BadRequestException(
        errorPayload(
          "Student is not assigned to workspace",
          "WORKSPACE_STUDENT_NOT_ASSIGNED",
        ),
      );
    }

    const user = member.user;

    if (dto.email && dto.email !== user.email) {
      const emailExist = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExist) {
        throw new BadRequestException(
          errorPayload(
            "Email already exists",
            "WORKSPACE_STUDENT_EMAIL_ALREADY_EXISTS",
          ),
        );
      }
    }

    if (dto.userName && dto.userName !== user.userName) {
      const userNameExist = await this.userRepo.findOne({
        where: { userName: dto.userName },
      });
      if (userNameExist) {
        throw new BadRequestException(
          errorPayload(
            "Username already exists",
            "WORKSPACE_STUDENT_USERNAME_ALREADY_EXISTS",
          ),
        );
      }
    }

    Object.assign(user, dto);
    member.user = await this.userRepo.save(user);

    return WorkspaceStudentListItemDto.fromEntity(member);
  }

  async getStudentDetail(
    workspaceId: string,
    studentId: string,
  ): Promise<StudentDetailResponseDto> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const member = await this.memberRepo.findOne({
      where: {
        workspace: {
          id: workspaceId,
        },
        user: {
          id: studentId,
          accountType: AccountType.STUDENT,
        },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: {
        user: true,
        role: true,
      },
    });

    if (!member) {
      throw new BadRequestException(
        errorPayload(
          "Student is not assigned to workspace",
          "WORKSPACE_STUDENT_NOT_ASSIGNED",
        ),
      );
    }

    const classMemberships = await this.classStudentRepo.find({
      where: {
        student: {
          id: studentId,
        },
        classEntity: {
          workspace: {
            id: workspaceId,
          },
        },
      },
      relations: {
        classEntity: true,
      },
      order: {
        classEntity: {
          className: "ASC",
        },
      },
    });

    const classes = classMemberships.map((membership) => ({
      id: membership.classEntity.id,
      className: membership.classEntity.className,
      description: membership.classEntity.description,
    }));

    const classIds = classes.map((classItem) => classItem.id);

    if (classIds.length === 0) {
      return {
        student: {
          studentId: member.user.id,
          fullName: member.user.fullName,
          userName: member.user.userName,
          email: member.user.email,
          role: member.role.name,
          status: member.status,
        },

        classes,

        summary: {
          classCount: 0,
          completedAssignmentCount: 0,
          manualAverageScore: null,
          quizAveragePercentage: null,
        },

        results: [],
      };
    }

    const assignments = await this.assignmentRepo.find({
      where: {
        session: {
          classEntity: {
            id: In(classIds),
          },
        },
      },
      relations: {
        session: {
          classEntity: true,
        },
      },
      order: {
        timeStart: "DESC",
      },
    });

    if (assignments.length === 0) {
      return {
        student: {
          studentId: member.user.id,
          fullName: member.user.fullName,
          userName: member.user.userName,
          email: member.user.email,
          role: member.role.name,
          status: member.status,
        },

        classes,

        summary: {
          classCount: classes.length,
          completedAssignmentCount: 0,
          manualAverageScore: null,
          quizAveragePercentage: null,
        },

        results: [],
      };
    }

    const assignmentIds = assignments.map((assignment) => assignment.id);

    const [submissions, quizAttempts] = await Promise.all([
      this.submissionRepo.find({
        where: {
          student: {
            id: studentId,
          },
          assignment: {
            id: In(assignmentIds),
          },
        },
        relations: {
          assignment: true,
        },
      }),

      this.quizAttemptRepo.find({
        where: {
          student: {
            id: studentId,
          },
          assignment: {
            id: In(assignmentIds),
          },
        },
        relations: {
          assignment: true,
        },
      }),
    ]);

    const submissionMap = new Map(
      submissions.map((submission) => [submission.assignment.id, submission]),
    );

    const quizAttemptMap = new Map(
      quizAttempts.map((attempt) => [attempt.assignment.id, attempt]),
    );

    const results: StudentLearningResult[] = assignments.map((assignment) => {
      const classEntity = assignment.session.classEntity;

      if (assignment.type === AssignmentType.QUIZ) {
        const attempt = quizAttemptMap.get(assignment.id);

        if (!attempt) {
          return {
            assignmentId: assignment.id,
            classId: classEntity.id,
            className: classEntity.className,
            title: assignment.title,
            type: "quiz",
            score: null,
            maxScore: null,
            status: "not_submitted",
            completedAt: null,
          };
        }

        const score = attempt.score === null ? null : Number(attempt.score);

        const maxScore =
          attempt.maxScore === null ? null : Number(attempt.maxScore);

        const submitted =
          attempt.status === AssignmentQuizAttemptStatus.SUBMITTED ||
          Boolean(attempt.submittedAt);

        return {
          assignmentId: assignment.id,
          classId: classEntity.id,
          className: classEntity.className,
          title: assignment.title,
          type: "quiz",
          score,
          maxScore,

          status: submitted ? "completed" : "in_progress",

          completedAt: attempt.submittedAt?.toISOString() ?? null,
        };
      }

      const submission = submissionMap.get(assignment.id);

      if (!submission) {
        return {
          assignmentId: assignment.id,
          classId: classEntity.id,
          className: classEntity.className,
          title: assignment.title,
          type: "manual",
          score: null,
          maxScore: null,
          status: "not_submitted",
          completedAt: null,
        };
      }

      const grade = submission.grade === null ? null : Number(submission.grade);

      return {
        assignmentId: assignment.id,
        classId: classEntity.id,
        className: classEntity.className,
        title: assignment.title,
        type: "manual",
        score: grade,

        maxScore: null,

        status: grade !== null ? "graded" : "submitted",

        completedAt: submission.submittedAt?.toISOString() ?? null,
      };
    });

    const manualScores = results
      .filter(
        (
          result,
        ): result is StudentLearningResult & {
          score: number;
        } => result.type === "manual" && result.score !== null,
      )
      .map((result) => result.score);

    const manualAverageScore =
      manualScores.length > 0
        ? Number(
            (
              manualScores.reduce((sum, score) => sum + score, 0) /
              manualScores.length
            ).toFixed(2),
          )
        : null;

    const quizPercentages = results
      .filter(
        (result) =>
          result.type === "quiz" &&
          result.status === "completed" &&
          result.score !== null &&
          result.maxScore !== null &&
          result.maxScore > 0,
      )
      .map((result) => (result.score! / result.maxScore!) * 100);

    const quizAveragePercentage =
      quizPercentages.length > 0
        ? Number(
            (
              quizPercentages.reduce((sum, percentage) => sum + percentage, 0) /
              quizPercentages.length
            ).toFixed(2),
          )
        : null;

    const completedAssignmentCount = results.filter(
      (result) =>
        result.status === "submitted" ||
        result.status === "graded" ||
        result.status === "completed",
    ).length;

    return {
      student: {
        studentId: member.user.id,
        fullName: member.user.fullName,
        userName: member.user.userName,
        email: member.user.email,
        role: member.role.name,
        status: member.status,
      },

      classes,

      summary: {
        classCount: classes.length,

        completedAssignmentCount,

        manualAverageScore,

        quizAveragePercentage,
      },

      results,
    };
  }

  async removeStudentFromWorkspace(
    workspaceId: string,
    studentId: string,
  ): Promise<RemoveWorkspaceStudentResponseDto> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const member = await this.memberRepo.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: studentId, accountType: AccountType.STUDENT },
      },
      relations: {
        user: true,
      },
    });
    if (!member) {
      throw new BadRequestException(
        errorPayload(
          "Student is not assigned to workspace",
          "WORKSPACE_STUDENT_NOT_ASSIGNED",
        ),
      );
    }

    return this.workspaceRepo.manager.transaction(async (manager) => {
      const classes = await manager.getRepository(ClassEntity).find({
        where: {
          workspace: { id: workspaceId },
        },
        select: {
          id: true,
        },
      });
      const classIds = classes.map((classEntity) => classEntity.id);

      let removedClassCount = 0;
      if (classIds.length > 0) {
        const deleteResult = await manager.getRepository(ClassStudent).delete({
          classEntity: { id: In(classIds) },
          student: { id: studentId },
        });
        removedClassCount = deleteResult.affected ?? 0;
      }

      await manager.getRepository(WorkspaceMember).delete(member.id);

      return RemoveWorkspaceStudentResponseDto.fromData({
        workspaceId,
        studentId,
        removedClassCount,
      });
    });
  }

  async getMyWorkspace(userId: string): Promise<WorkspaceDetailResponseDto> {
    const members = await this.memberRepo.find({
      where: {
        user: { id: userId },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ["workspace", "role"],
    });
    if (members.length === 0) {
      throw new BadRequestException(
        errorPayload(
          "Current workspace not found",
          "WORKSPACE_CURRENT_NOT_FOUND",
        ),
      );
    }

    const currentMembership = [...members].sort((left, right) => {
      if (left.role?.name === "owner" && right.role?.name !== "owner") {
        return -1;
      }
      if (left.role?.name !== "owner" && right.role?.name === "owner") {
        return 1;
      }

      return left.workspace.name.localeCompare(right.workspace.name);
    })[0];

    return this.getWorkspaceDetail(currentMembership.workspace.id, userId);
  }

  async getMyWorkspaceSubscription(
    userId: string,
  ): Promise<WorkspaceSubscriptionResponseDto> {
    const workspace = await this.workspaceRepo.findOne({
      where: {
        owner: { id: userId },
      },
    });
    if (!workspace) {
      throw new BadRequestException(
        errorPayload(
          "Current workspace not found",
          "WORKSPACE_CURRENT_NOT_FOUND",
        ),
      );
    }

    const now = new Date();

    const usableStatuses = [
      WorkspaceSubscriptionStatus.ACTIVE,
      WorkspaceSubscriptionStatus.TRIALING,
    ];

    const subscription = await this.workspaceSubscriptionRepo.findOne({
      where: [
        {
          workspace: { id: workspace.id },
          status: In(usableStatuses),
          endedAt: IsNull(),
        },
        {
          workspace: { id: workspace.id },
          status: In(usableStatuses),
          endedAt: MoreThan(now),
        },
      ],
      relations: {
        workspace: true,
        plan: {
          features: true,
          prices: true,
        },
      },
      order: {
        startedAt: "DESC",
      },
    });
    if (!subscription) {
      throw new BadRequestException(
        errorPayload(
          "Workspace subscription not found",
          "WORKSPACE_SUBSCRIPTION_NOT_FOUND",
        ),
      );
    }

    return WorkspaceSubscriptionResponseDto.fromEntity(subscription);
  }
}
