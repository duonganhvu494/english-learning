// src/rbac/rbac.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from 'src/workspaces/entities/workspace-member.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';

interface PermissionCheckInput {
  userId: string;
  workspaceId: string;
  action: string;
  resource: string;
}

interface RoleCheckInput {
  userId: string;
  workspaceId: string;
  roleNames: string[];
}

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly systemRoles = [
    {
      name: 'owner',
      description: 'Workspace owner with full access',
    },
    {
      name: 'admin',
      description: 'Workspace administrator',
    },
    {
      name: 'teacher',
      description: 'Teacher in workspace',
    },
    {
      name: 'student',
      description: 'Student in workspace',
    },
  ];

  private readonly systemPermissions = [
    {
      action: 'create',
      resource: 'workspace_member',
      description: 'Add member to workspace',
    },
    {
      action: 'read',
      resource: 'workspace',
      description: 'View workspace information',
    },
  ];

  private readonly rolePermissionMap: Record<string, string[]> = {
    owner: ['create:workspace_member', 'read:workspace'],
    admin: ['create:workspace_member', 'read:workspace'],
    teacher: ['create:workspace_member', 'read:workspace'],
    student: ['read:workspace'],
  };

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,

    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedSystemRoles();
    await this.seedSystemPermissions();
    await this.seedSystemRolePermissions();
  }

  private async seedSystemRoles() {
    for (const roleSeed of this.systemRoles) {
      const exist = await this.roleRepo.findOne({
        where: {
          name: roleSeed.name,
          isSystem: true,
          workspaceId: IsNull(),
        },
      });

      if (!exist) {
        const role = this.roleRepo.create({
          name: roleSeed.name,
          description: roleSeed.description,
          isSystem: true,
          workspaceId: null,
        });
        await this.roleRepo.save(role);
      } else if (exist.description !== roleSeed.description) {
        exist.description = roleSeed.description;
        await this.roleRepo.save(exist);
      }
    }
  }

  private async seedSystemPermissions() {
    for (const seed of this.systemPermissions) {
      const exist = await this.permissionRepo.findOne({
        where: {
          action: seed.action,
          resource: seed.resource,
        },
      });

      if (!exist) {
        const permission = this.permissionRepo.create(seed);
        await this.permissionRepo.save(permission);
      } else if (exist.description !== seed.description) {
        exist.description = seed.description;
        await this.permissionRepo.save(exist);
      }
    }
  }

  private async seedSystemRolePermissions() {
    for (const [roleName, permissionKeys] of Object.entries(
      this.rolePermissionMap,
    )) {
      const role = await this.roleRepo.findOne({
        where: {
          name: roleName,
          isSystem: true,
          workspaceId: IsNull(),
        },
      });

      if (!role) {
        continue;
      }

      for (const key of permissionKeys) {
        const [action, resource] = key.split(':');
        const permission = await this.permissionRepo.findOne({
          where: { action, resource },
        });

        if (!permission) {
          continue;
        }

        const exist = await this.rolePermissionRepo.findOne({
          where: {
            role: { id: role.id },
            permission: { id: permission.id },
          },
        });

        if (!exist) {
          const rolePermission = this.rolePermissionRepo.create({
            role,
            permission,
          });
          await this.rolePermissionRepo.save(rolePermission);
        }
      }
    }
  }

  async hasPermission(input: PermissionCheckInput): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: input.userId } });
    if (!user) {
      return false;
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const member = await this.memberRepo.findOne({
      where: {
        workspace: { id: input.workspaceId },
        user: { id: input.userId },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });

    if (!member?.role?.rolePermissions?.length) {
      return false;
    }

    return member.role.rolePermissions.some(
      (rp) =>
        rp.permission.action === input.action &&
        rp.permission.resource === input.resource,
    );
  }

  async hasAnyRole(input: RoleCheckInput): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: input.userId } });
    if (!user) {
      return false;
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const member = await this.memberRepo.findOne({
      where: {
        workspace: { id: input.workspaceId },
        user: { id: input.userId },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: {
        role: true,
      },
    });

    if (!member?.role?.name) {
      return false;
    }

    return input.roleNames.includes(member.role.name);
  }
}
