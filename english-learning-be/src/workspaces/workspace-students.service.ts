import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { Role } from 'src/rbac/entities/role.entity';
import { CreateStudentDto } from 'src/users/dto/create-student.dto';
import { AccountType, User } from 'src/users/entities/user.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { Workspace } from './entities/workspace.entity';

export type ProvisionedWorkspaceStudent = {
  plainPassword: string;
  user: User;
  workspaceRole: Role;
};

@Injectable()
export class WorkspaceStudentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
  ) {}

  async provisionWorkspaceStudent(
    workspace: Workspace,
    dto: CreateStudentDto,
  ): Promise<ProvisionedWorkspaceStudent> {
    const workspaceStudentRole = await this.roleRepo.findOne({
      where: {
        name: 'student',
        isSystem: true,
        workspaceId: IsNull(),
      },
    });
    if (!workspaceStudentRole) {
      throw new BadRequestException(
        errorPayload(
          'Student role not found',
          'WORKSPACE_STUDENT_ROLE_NOT_FOUND',
        ),
      );
    }

    const normalizedEmail = dto.email.trim();
    const normalizedUserName = dto.userName.trim();
    const normalizedFullName = dto.fullName.trim();

    return this.memberRepo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const memberRepo = manager.getRepository(WorkspaceMember);

      const existedUser = await userRepo.findOne({
        where: [
          { email: normalizedEmail },
          { userName: normalizedUserName },
        ],
      });
      if (existedUser) {
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
        fullName: normalizedFullName,
        email: normalizedEmail,
        userName: normalizedUserName,
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
        role: workspaceStudentRole,
      });
      await memberRepo.save(member);

      return {
        plainPassword,
        user: savedUser,
        workspaceRole: workspaceStudentRole,
      };
    });
  }

  private generateRandomPassword(length = 10): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  }
}
