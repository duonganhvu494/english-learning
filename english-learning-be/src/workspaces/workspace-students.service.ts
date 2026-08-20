import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { IsNull, Repository } from "typeorm";
import { errorPayload } from "src/common/utils/error-payload.util";
import { MailService } from "src/mail/mail.service";
import { Role } from "src/rbac/entities/role.entity";
import { CreateStudentDto } from "src/users/dto/create-student.dto";
import { AccountType, User } from "src/users/entities/user.entity";
import { WorkspaceEntitlementService } from "./workspace-entitlement.service";
import { WorkspaceMember } from "./entities/workspace-member.entity";
import { Workspace } from "./entities/workspace.entity";
import { StudentProvisioningMode } from "./types/student-provisioning-mode.type";
import { MailQueueService } from "src/mail/queue/mail-queue.service";

export type ProvisionedWorkspaceStudent = {
  mode: StudentProvisioningMode;
  user: User;
  workspaceRole: Role;
};

type CreatedWorkspaceStudentDraft = {
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

    private readonly mailQueueService: MailQueueService,
    private readonly workspaceEntitlementService: WorkspaceEntitlementService,
  ) {}

  async provisionWorkspaceStudent(
    workspace: Workspace,
    dto: CreateStudentDto,
  ): Promise<ProvisionedWorkspaceStudent> {
    const workspaceStudentRole = await this.roleRepo.findOne({
      where: {
        name: "student",
        isSystem: true,
        workspaceId: IsNull(),
      },
    });
    if (!workspaceStudentRole) {
      throw new BadRequestException(
        errorPayload(
          "Student role not found",
          "WORKSPACE_STUDENT_ROLE_NOT_FOUND",
        ),
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedFullName = dto.fullName.trim();

    const createdStudent = await this.memberRepo.manager.transaction(
      async (manager) => {
        const userRepo = manager.getRepository(User);
        const memberRepo = manager.getRepository(WorkspaceMember);

        const existingUser = await userRepo.findOne({
          where: { email: normalizedEmail },
        });
        if (existingUser) {
          if (existingUser.accountType !== AccountType.STUDENT) {
            throw new BadRequestException(
              errorPayload(
                "Email already belongs to another account",
                "WORKSPACE_STUDENT_EMAIL_BELONGS_TO_ANOTHER_ACCOUNT",
              ),
            );
          }

          if (!existingUser.isActive) {
            throw new BadRequestException(
              errorPayload(
                "Student account is inactive",
                "WORKSPACE_STUDENT_ACCOUNT_INACTIVE",
              ),
            );
          }

          const existingMember = await memberRepo.findOne({
            where: {
              workspace: { id: workspace.id },
              user: { id: existingUser.id },
            },
            relations: {
              role: true,
            },
          });

          if (existingMember) {
            return {
              mode: "already_assigned" as const,
              user: existingUser,
              workspaceRole: existingMember.role || workspaceStudentRole,
            };
          }

          await this.workspaceEntitlementService.assertStudentQuotaAvailable(
            workspace.id,
          );

          const member = memberRepo.create({
            workspace,
            user: existingUser,
            role: workspaceStudentRole,
          });
          await memberRepo.save(member);

          return {
            mode: "attached" as const,
            user: existingUser,
            workspaceRole: workspaceStudentRole,
          };
        }

        await this.workspaceEntitlementService.assertStudentQuotaAvailable(
          workspace.id,
        );

        const normalizedUserName = await this.generateUniqueUserName(
          userRepo,
          normalizedFullName,
        );
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
          mode: "created" as const,
          plainPassword,
          user: savedUser,
          workspaceRole: workspaceStudentRole,
        };
      },
    );

    if (createdStudent.mode === "created") {
      await this.sendProvisionedStudentCredentials(createdStudent);
    }

    return {
      mode: createdStudent.mode,
      user: createdStudent.user,
      workspaceRole: createdStudent.workspaceRole,
    };
  }

  private generateRandomPassword(length = 10): string {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  }

  private async sendProvisionedStudentCredentials(
    createdStudent: CreatedWorkspaceStudentDraft,
  ): Promise<void> {
    await this.mailQueueService.enqueueStudentCredentials({
      email: createdStudent.user.email,
      fullName: createdStudent.user.fullName,
      userName: createdStudent.user.userName,
      temporaryPassword: createdStudent.plainPassword,
    });
  }

  private async generateUniqueUserName(
    userRepo: Repository<User>,
    fullName: string,
  ): Promise<string> {
    const baseUserName = this.buildUserNameBase(fullName);
    let candidate = baseUserName;
    let suffix = 1;

    while (await userRepo.exists({ where: { userName: candidate } })) {
      candidate = `${baseUserName}${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private buildUserNameBase(fullName: string): string {
    const normalized = fullName
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    return normalized || "student";
  }
}
