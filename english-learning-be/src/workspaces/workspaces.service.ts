// src/workspaces/workspaces.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "./entities/workspace.entity";
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from "./entities/workspace-member.entity";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { AddWorkspaceMemberDto } from "./dto/add-workspace-member.dto";
import { User, AccountType } from "src/users/entities/user.entity";
import { WorkspaceResponseDto } from "./dto/workspace-response.dto";
import { Role } from "src/rbac/entities/role.entity";

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
  ) {}

  // ================= CREATE WORKSPACE =================
  async createWorkspace(dto: CreateWorkspaceDto, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    if (user.accountType !== AccountType.TEACHER) {
      throw new ForbiddenException("Only teacher account can create workspace");
    }

    const existedWorkspace = await this.workspaceRepo.findOne({
      where: {
        name: dto.name,
        owner: { id: userId },
      },
    });

    if (existedWorkspace) {
      throw new BadRequestException(
        "You already have a workspace with this name",
      );
    }

    const workspace = this.workspaceRepo.create({
      name: dto.name,
      owner: user,
      isActive: true,
    });

    const savedWorkspace = await this.workspaceRepo.save(workspace);
    
    const ownerRole = await this.roleRepo.findOne({
      where: { name: "owner", isSystem: true },
    });
    if (!ownerRole) {
      throw new BadRequestException("Owner role not found");
    }

    const member = this.memberRepo.create({
      workspace: savedWorkspace,
      user,
      role: ownerRole,
    });

    await this.memberRepo.save(member);

    return WorkspaceResponseDto.fromEntity(savedWorkspace);
  }

  // ================= ADD MEMBER =================
  async addMember(workspaceId: string, dto: AddWorkspaceMemberDto) {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException("Workspace not found");

    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
    });
    if (!user) throw new BadRequestException("User not found");

    const role = await this.roleRepo.findOne({
      where: { name: dto.roleName },
    });
    if (!role) throw new BadRequestException("Role not found");

    const exist = await this.memberRepo.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: dto.userId },
      },
    });
    if (exist) {
      throw new BadRequestException("User already in workspace");
    }

    const member = this.memberRepo.create({
      workspace,
      user,
      role,
    });

    return this.memberRepo.save(member);
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
