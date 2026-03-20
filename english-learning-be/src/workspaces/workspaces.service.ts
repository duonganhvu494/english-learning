// src/workspaces/workspaces.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { Workspace } from "./entities/workspace.entity";
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from "./entities/workspace-member.entity";
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

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    private readonly workspaceAccessService: WorkspaceAccessService,
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
        name: dto.name,
        owner: { id: userId },
      },
    });

    if (existedWorkspace) {
      throw new BadRequestException(
        errorPayload(
          'You already have a workspace with this name',
          'WORKSPACE_NAME_ALREADY_EXISTS',
        ),
      );
    }

    const workspace = this.workspaceRepo.create({
      name: dto.name,
      owner: user,
      isActive: true,
    });

    const savedWorkspace = await this.workspaceRepo.save(workspace);
    
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

    const member = this.memberRepo.create({
      workspace: savedWorkspace,
      user,
      role: ownerRole,
    });

    await this.memberRepo.save(member);

    return WorkspaceResponseDto.fromEntity(savedWorkspace);
  }

  async getWorkspaceDetail(
    workspaceId: string,
    actorUserId: string,
  ): Promise<WorkspaceDetailResponseDto> {
    const [workspace, viewerMembership, studentCount, classCount] =
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

    if (!viewerMembership) {
      throw new ForbiddenException(
        errorPayload(
          'You are not a member of this workspace',
          'WORKSPACE_MEMBER_REQUIRED',
        ),
      );
    }

    return WorkspaceDetailResponseDto.fromData({
      workspace,
      currentUserRole: viewerMembership.role.name,
      studentCount,
      classCount,
    });
  }

  async createStudentInWorkspace(
    workspaceId: string,
    dto: CreateStudentDto,
    actorUserId: string,
  ) {
    const workspace = await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage:
          "Only workspace owner can manage workspace students",
        ownerForbiddenCode: 'WORKSPACE_STUDENT_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          "Only teacher workspace owner can manage workspace students",
        teacherForbiddenCode:
          'WORKSPACE_STUDENT_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
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
    actorUserId: string,
  ) {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage:
          "Only workspace owner can manage workspace students",
        ownerForbiddenCode: 'WORKSPACE_STUDENT_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          "Only teacher workspace owner can manage workspace students",
        teacherForbiddenCode:
          'WORKSPACE_STUDENT_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

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
    actorUserId: string,
  ): Promise<WorkspaceStudentListItemDto> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage:
          'Only workspace owner can manage workspace students',
        ownerForbiddenCode: 'WORKSPACE_STUDENT_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage workspace students',
        teacherForbiddenCode:
          'WORKSPACE_STUDENT_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

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
    actorUserId: string,
  ): Promise<RemoveWorkspaceStudentResponseDto> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage:
          "Only workspace owner can manage workspace students",
        ownerForbiddenCode: 'WORKSPACE_STUDENT_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          "Only teacher workspace owner can manage workspace students",
        teacherForbiddenCode:
          'WORKSPACE_STUDENT_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

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

  // ================= LIST USER WORKSPACES =================
  async listMyWorkspaces(userId: string) {
    const members = await this.memberRepo.find({
      where: {
        user: { id: userId },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ["workspace", "role"],
    });

    return members.map((m) => ({
      workspaceId: m.workspace.id,
      workspaceName: m.workspace.name,
      role: m.role.name,
    }));
  }
}
