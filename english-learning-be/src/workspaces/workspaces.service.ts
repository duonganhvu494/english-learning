// src/workspaces/workspaces.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, MoreThan, Repository } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Workspace } from "./entities/workspace.entity";
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from "./entities/workspace-member.entity";
import {
  WorkspaceSubscription,
  WorkspaceSubscriptionSource,
  WorkspaceSubscriptionStatus,
} from './entities/workspace-subscription.entity';
import { Plan } from './entities/plan.entity';
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
import { errorPayload } from 'src/common/utils/error-payload.util';
import { WorkspaceEntitlementService } from './workspace-entitlement.service';
import { WorkspaceSubscriptionResponseDto } from './dto/workspace-subscription-response.dto';

@Injectable()
export class WorkspacesService {
  private readonly defaultWorkspacePlanCode = 'free';

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(WorkspaceSubscription)
    private readonly workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly workspaceEntitlementService: WorkspaceEntitlementService,
  ) {}

  private generateRandomPassword(length = 10): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  }

  private isUniqueConstraintViolation(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    );
  }

  // ================= CREATE WORKSPACE =================
  async createWorkspace(dto: CreateWorkspaceDto, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'WORKSPACE_OWNER_NOT_FOUND'),
      );
    }

    if (user.accountType !== AccountType.TEACHER) {
      throw new ForbiddenException(
        errorPayload(
          'Only teacher account can create workspace',
          'WORKSPACE_CREATE_TEACHER_ONLY',
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
          'Each teacher can own only one workspace',
          'WORKSPACE_OWNER_ALREADY_HAS_WORKSPACE',
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
        errorPayload('Owner role not found', 'WORKSPACE_OWNER_ROLE_NOT_FOUND'),
      );
    }

    const defaultPlan = await this.planRepo.findOne({
      where: {
        code: this.defaultWorkspacePlanCode,
        isPublic: true,
        isActive: true,
      },
    });
    if (!defaultPlan) {
      throw new BadRequestException(
        errorPayload(
          'Default workspace plan not found',
          'WORKSPACE_DEFAULT_PLAN_NOT_FOUND',
        ),
      );
    }

    const workspace = this.workspaceRepo.create({
      name: dto.name,
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
            'Each teacher can own only one workspace',
            'WORKSPACE_OWNER_ALREADY_HAS_WORKSPACE',
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
          .createQueryBuilder('member')
          .innerJoin('member.user', 'user')
          .innerJoin('member.workspace', 'workspace')
          .where('workspace.id = :workspaceId', { workspaceId })
          .andWhere('member.status = :status', {
            status: WorkspaceMemberStatus.ACTIVE,
          })
          .andWhere('user.accountType = :accountType', {
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
        errorPayload('Workspace not found', 'WORKSPACE_NOT_FOUND'),
      );
    }

    return WorkspaceDetailResponseDto.fromData({
      workspace,
      currentUserRole:
        viewerMembership?.role.name ??
        (actorUser?.isSuperAdmin ? 'owner' : 'unknown'),
      studentCount,
      classCount,
    });
  }

  async createStudentInWorkspace(
    workspaceId: string,
    dto: CreateStudentDto,
  ) {
    const workspace = await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);
    
    await this.workspaceEntitlementService.assertStudentQuotaAvailable(
      workspaceId,
    );

    const studentRole = await this.roleRepo.findOne({
      where: {
        name: "student",
        isSystem: true,
        workspaceId: IsNull(),
      },
    });
    if (!studentRole) {
      throw new BadRequestException(
        errorPayload(
          'Student role not found',
          'WORKSPACE_STUDENT_ROLE_NOT_FOUND',
        ),
      );
    }

    return this.workspaceRepo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const memberRepo = manager.getRepository(WorkspaceMember);

      const exist = await userRepo.findOne({
        where: [{ email: dto.email }, { userName: dto.userName }],
      });
      if (exist) {
        throw new BadRequestException(
          errorPayload(
            'Email or username already exists',
            'WORKSPACE_STUDENT_CREDENTIALS_ALREADY_EXIST',
          ),
        );
      }

      const plainPassword = this.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = userRepo.create({
        fullName: dto.fullName,
        email: dto.email,
        userName: dto.userName,
        password: hashedPassword,
        mustChangePassword: true,
        accountType: AccountType.STUDENT,
        isActive: true,
        isSuperAdmin: false,
      });
      const savedUser = await userRepo.save(user);

      const member = memberRepo.create({
        workspace,
        user: savedUser,
        role: studentRole,
      });
      await memberRepo.save(member);

      return WorkspaceStudentResponseDto.fromData({
        workspaceId: workspace.id,
        role: studentRole.name,
        plainPassword,
        user: UserProfileResponse.fromEntity(savedUser),
      });
    });
  }

  async listWorkspaceStudents(
    workspaceId: string,
  ) {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const members = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.user', 'user')
      .innerJoinAndSelect('member.role', 'role')
      .innerJoin('member.workspace', 'workspace')
      .where('workspace.id = :workspaceId', { workspaceId })
      .andWhere('member.status = :status', {
        status: WorkspaceMemberStatus.ACTIVE,
      })
      .andWhere('user.accountType = :accountType', {
        accountType: AccountType.STUDENT,
      })
      .orderBy('user.fullName', 'ASC')
      .getMany();

    return members.map((member) => WorkspaceStudentListItemDto.fromEntity(member));
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
          'Student is not assigned to workspace',
          'WORKSPACE_STUDENT_NOT_ASSIGNED',
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
            'Email already exists',
            'WORKSPACE_STUDENT_EMAIL_ALREADY_EXISTS',
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
            'Username already exists',
            'WORKSPACE_STUDENT_USERNAME_ALREADY_EXISTS',
          ),
        );
      }
    }

    Object.assign(user, dto);
    member.user = await this.userRepo.save(user);

    return WorkspaceStudentListItemDto.fromEntity(member);
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
          'Student is not assigned to workspace',
          'WORKSPACE_STUDENT_NOT_ASSIGNED',
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

  // ================= CURRENT USER WORKSPACE =================
  async getMyWorkspace(userId: string): Promise<WorkspaceDetailResponseDto> {
    const members = await this.memberRepo.find({
      where: {
        user: { id: userId },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ['workspace', 'role'],
    });
    if (members.length === 0) {
      throw new BadRequestException(
        errorPayload(
          'Current workspace not found',
          'WORKSPACE_CURRENT_NOT_FOUND',
        ),
      );
    }

    const currentMembership = [...members].sort((left, right) => {
      if (left.role?.name === 'owner' && right.role?.name !== 'owner') {
        return -1;
      }
      if (left.role?.name !== 'owner' && right.role?.name === 'owner') {
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
          'Current workspace not found',
          'WORKSPACE_CURRENT_NOT_FOUND',
        ),
      );
    }

    const subscription = await this.workspaceSubscriptionRepo.findOne({
      where: [
        {
          workspace: { id: workspace.id },
          endedAt: IsNull(),
        },
        {
          workspace: { id: workspace.id },
          endedAt: MoreThan(new Date()),
        },
      ],
      relations: {
        workspace: true,
        plan: {
          features: true,
        },
      },
      order: {
        endedAt: 'DESC',
      },
    });
    if (!subscription) {
      throw new BadRequestException(
        errorPayload(
          'Workspace subscription not found',
          'WORKSPACE_SUBSCRIPTION_NOT_FOUND',
        ),
      );
    }

    return WorkspaceSubscriptionResponseDto.fromEntity(subscription);
  }
}
