// src/rbac/rbac.service.ts
import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { CreateClassRoleDto } from './dto/create-class-role.dto';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { CustomRoleResponseDto } from './dto/custom-role-response.dto';
import { DeleteRoleResponseDto } from './dto/delete-role-response.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { User } from 'src/users/entities/user.entity';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from 'src/workspaces/entities/workspace-member.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { RbacScopeType } from './interfaces/scope-options.interface';
import { WorkspaceAccessService } from './workspace-access.service';

interface PermissionCheckInput {
  userId: string;
  scopeType: RbacScopeType;
  scopeId: string;
  action: string;
  resource: string;
}

interface RoleCheckInput {
  userId: string;
  scopeType: RbacScopeType;
  scopeId: string;
  roleNames: string[];
}

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly defaultClassStudentRoleName = 'student';
  private readonly defaultClassStudentPermissionKeys = ['read:session'];
  private readonly workspaceManagementPermissions = [
    'read:workspace',
    'create:session',
    'read:session',
    'update:session',
    'delete:session',
    'read:attendance',
    'update:attendance',
    'create:lecture',
    'read:lecture',
    'update:lecture',
    'delete:lecture',
    'create:assignment',
    'read:assignment',
    'update:assignment',
    'delete:assignment',
  ];

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
      action: 'read',
      resource: 'workspace',
      description: 'View workspace information',
    },
    {
      action: 'create',
      resource: 'session',
      description: 'Create class sessions',
    },
    {
      action: 'read',
      resource: 'session',
      description: 'View class sessions',
    },
    {
      action: 'update',
      resource: 'session',
      description: 'Update class sessions',
    },
    {
      action: 'delete',
      resource: 'session',
      description: 'Delete class sessions',
    },
    {
      action: 'read',
      resource: 'attendance',
      description: 'View session attendance',
    },
    {
      action: 'update',
      resource: 'attendance',
      description: 'Update session attendance',
    },
    {
      action: 'create',
      resource: 'lecture',
      description: 'Create lectures',
    },
    {
      action: 'read',
      resource: 'lecture',
      description: 'View lectures',
    },
    {
      action: 'update',
      resource: 'lecture',
      description: 'Update lectures',
    },
    {
      action: 'delete',
      resource: 'lecture',
      description: 'Delete lectures',
    },
    {
      action: 'create',
      resource: 'assignment',
      description: 'Create assignments',
    },
    {
      action: 'read',
      resource: 'assignment',
      description: 'View assignments',
    },
    {
      action: 'update',
      resource: 'assignment',
      description: 'Update assignments',
    },
    {
      action: 'delete',
      resource: 'assignment',
      description: 'Delete assignments',
    },
  ];

  private readonly rolePermissionMap: Record<string, string[]> = {
    owner: [...this.workspaceManagementPermissions],
    admin: [...this.workspaceManagementPermissions],
    teacher: [...this.workspaceManagementPermissions],
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

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async onModuleInit() {
    await this.seedSystemRoles();
    await this.seedSystemPermissions();
    await this.seedSystemRolePermissions();
    await this.seedDefaultClassStudentRoles();
  }

  private async seedSystemRoles() {
    for (const roleSeed of this.systemRoles) {
      const exist = await this.roleRepo.findOne({
        where: {
          name: roleSeed.name,
          isSystem: true,
          workspaceId: IsNull(),
          classId: IsNull(),
        },
      });

      if (!exist) {
        const role = this.roleRepo.create({
          name: roleSeed.name,
          description: roleSeed.description,
          isSystem: true,
          workspaceId: null,
          classId: null,
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
          classId: IsNull(),
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
    const role = await this.findAssignedRole({
      userId: input.userId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      withPermissions: true,
    });
    if (!role?.rolePermissions?.length) {
      return false;
    }

    return role.rolePermissions.some(
      (rp) =>
        rp.permission.action === input.action &&
        rp.permission.resource === input.resource,
    );
  }

  async hasAnyRole(input: RoleCheckInput): Promise<boolean> {
    const role = await this.findAssignedRole({
      userId: input.userId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      withPermissions: false,
    });
    if (!role?.name) {
      return false;
    }

    return input.roleNames.includes(role.name);
  }

  private async findAssignedRole(input: {
    userId: string;
    scopeType: RbacScopeType;
    scopeId: string;
    withPermissions: boolean;
  }): Promise<Role | null> {
    const user = await this.userRepo.findOne({ where: { id: input.userId } });
    if (!user) {
      return null;
    }

    if (user.isSuperAdmin) {
      return this.roleRepo.findOne({
        where: {
          name: 'owner',
          isSystem: true,
          workspaceId: IsNull(),
          classId: IsNull(),
        },
        relations: input.withPermissions
          ? {
              rolePermissions: {
                permission: true,
              },
            }
          : undefined,
      });
    }

    if (input.scopeType === 'workspace') {
      const member = await this.memberRepo.findOne({
        where: {
          workspace: { id: input.scopeId },
          user: { id: input.userId },
          status: WorkspaceMemberStatus.ACTIVE,
        },
        relations: input.withPermissions
          ? {
              role: {
                rolePermissions: {
                  permission: true,
                },
              },
            }
          : {
              role: true,
            },
      });

      return member?.role ?? null;
    }

    if (input.scopeType === 'class') {
      const classStudent = await this.classStudentRepo.findOne({
        where: {
          classEntity: { id: input.scopeId },
          student: { id: input.userId },
        },
        relations: input.withPermissions
          ? {
              role: {
                rolePermissions: {
                  permission: true,
                },
              },
            }
          : {
              role: true,
            },
      });

      return classStudent?.role ?? null;
    }

    return this.throwUnsupportedScopeType(input.scopeType);
  }

  async createCustomRole(
    workspaceId: string,
    dto: CreateCustomRoleDto,
    actorUserId: string,
  ): Promise<CustomRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        ownerForbiddenMessage:
          'Only workspace owner can manage custom roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage custom roles',
      },
    );

    const normalizedName = dto.name.trim();
    const normalizedDescription = dto.description?.trim() || undefined;
    const permissionKeys = [
      ...new Set(dto.permissionKeys.map((key) => key.trim())),
    ];

    const workspaceRole = await this.roleRepo.findOne({
      where: {
        name: normalizedName,
        workspaceId,
        classId: IsNull(),
        isSystem: false,
      },
    });
    if (workspaceRole) {
      throw new BadRequestException(
        'Role name already exists in this workspace',
      );
    }

    const systemRole = await this.roleRepo.findOne({
      where: {
        name: normalizedName,
        isSystem: true,
        workspaceId: IsNull(),
        classId: IsNull(),
      },
    });
    if (systemRole) {
      throw new BadRequestException(
        'Role name conflicts with reserved system role',
      );
    }

    const permissions = await Promise.all(
      permissionKeys.map((key) => this.findPermissionByKey(key)),
    );

    const createdRole = await this.roleRepo.manager.transaction(
      async (manager) => {
        const roleRepo = manager.getRepository(Role);
        const rolePermissionRepo = manager.getRepository(RolePermission);

        const role = roleRepo.create({
          name: normalizedName,
          description: normalizedDescription,
          isSystem: false,
          workspaceId,
          classId: null,
        });
        const savedRole = await roleRepo.save(role);

        for (const permission of permissions) {
          const rolePermission = rolePermissionRepo.create({
            role: savedRole,
            permission,
          });
          await rolePermissionRepo.save(rolePermission);
        }

        return savedRole;
      },
    );

    return CustomRoleResponseDto.fromEntity(
      createdRole,
      permissions.map(
        (permission) => `${permission.action}:${permission.resource}`,
      ),
    );
  }

  async listPermissions(
    workspaceId: string,
    actorUserId: string,
  ): Promise<PermissionResponseDto[]> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        ownerForbiddenMessage:
          'Only workspace owner can manage custom roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage custom roles',
      },
    );

    const permissions = await this.permissionRepo.find({
      order: {
        action: 'ASC',
        resource: 'ASC',
      },
    });

    return permissions.map((permission) =>
      PermissionResponseDto.fromEntity(permission),
    );
  }

  async listCustomRoles(
    workspaceId: string,
    actorUserId: string,
  ): Promise<CustomRoleResponseDto[]> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        ownerForbiddenMessage:
          'Only workspace owner can manage custom roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage custom roles',
      },
    );

    const roles = await this.roleRepo.find({
      where: {
        workspaceId,
        classId: IsNull(),
        isSystem: false,
      },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
      order: {
        name: 'ASC',
      },
    });

    return roles.map((role) =>
      CustomRoleResponseDto.fromEntity(role, this.buildPermissionKeys(role)),
    );
  }

  async updateCustomRole(
    workspaceId: string,
    roleId: string,
    dto: UpdateCustomRoleDto,
    actorUserId: string,
  ): Promise<CustomRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        ownerForbiddenMessage:
          'Only workspace owner can manage custom roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage custom roles',
      },
    );

    const role = await this.findWorkspaceCustomRoleOrThrow(workspaceId, roleId);
    await this.applyRoleUpdates(role, dto, {
      roleNameConflictMessage: 'Role name already exists in this workspace',
      scope: 'workspace',
    });

    const updatedRole = await this.loadRoleWithPermissions(role.id);
    return CustomRoleResponseDto.fromEntity(
      updatedRole,
      this.buildPermissionKeys(updatedRole),
    );
  }

  async deleteCustomRole(
    workspaceId: string,
    roleId: string,
    actorUserId: string,
  ): Promise<DeleteRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        ownerForbiddenMessage:
          'Only workspace owner can manage custom roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage custom roles',
      },
    );

    const role = await this.findWorkspaceCustomRoleOrThrow(workspaceId, roleId);
    const assignmentCount = await this.memberRepo.count({
      where: {
        role: { id: role.id },
      },
    });
    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete workspace role while it is still assigned to members',
      );
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('role_permissions')
        .where('"roleId" = :roleId', { roleId: role.id })
        .execute();

      await manager.getRepository(Role).delete(role.id);
    });

    return DeleteRoleResponseDto.fromData({
      roleId: role.id,
      workspaceId,
      classId: null,
    });
  }

  private async findPermissionByKey(key: string): Promise<Permission> {
    const [action, resource, extra] = key.split(':');
    if (!action || !resource || extra) {
      throw new BadRequestException(`Invalid permission key: ${key}`);
    }

    const permission = await this.permissionRepo.findOne({
      where: { action, resource },
    });
    if (!permission) {
      throw new BadRequestException(`Permission not found: ${key}`);
    }

    return permission;
  }

  async createClassCustomRole(
    classId: string,
    dto: CreateClassRoleDto,
    actorUserId: string,
  ): Promise<CustomRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        ownerForbiddenMessage: 'Only workspace owner can manage class roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class roles',
      },
    );

    const normalizedName = dto.name.trim();
    const normalizedDescription = dto.description?.trim() || undefined;
    const permissionKeys = [
      ...new Set((dto.permissionKeys ?? []).map((key) => key.trim())),
    ];

    const classRole = await this.roleRepo.findOne({
      where: {
        name: normalizedName,
        classId,
        workspaceId: IsNull(),
        isSystem: false,
      },
    });
    if (classRole) {
      throw new BadRequestException('Role name already exists in this class');
    }

    const systemRole = await this.roleRepo.findOne({
      where: {
        name: normalizedName,
        isSystem: true,
        workspaceId: IsNull(),
        classId: IsNull(),
      },
    });
    if (systemRole) {
      throw new BadRequestException(
        'Role name conflicts with reserved system role',
      );
    }

    const permissions = await Promise.all(
      permissionKeys.map((key) => this.findPermissionByKey(key)),
    );

    const createdRole = await this.roleRepo.manager.transaction(
      async (manager) => {
        const roleRepo = manager.getRepository(Role);
        const rolePermissionRepo = manager.getRepository(RolePermission);

        const role = roleRepo.create({
          name: normalizedName,
          description: normalizedDescription,
          isSystem: false,
          workspaceId: null,
          classId,
        });
        const savedRole = await roleRepo.save(role);

        for (const permission of permissions) {
          const rolePermission = rolePermissionRepo.create({
            role: savedRole,
            permission,
          });
          await rolePermissionRepo.save(rolePermission);
        }

        return savedRole;
      },
    );

    return CustomRoleResponseDto.fromEntity(
      createdRole,
      permissions.map(
        (permission) => `${permission.action}:${permission.resource}`,
      ),
    );
  }

  async listClassCustomRoles(
    classId: string,
    actorUserId: string,
  ): Promise<CustomRoleResponseDto[]> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        ownerForbiddenMessage: 'Only workspace owner can manage class roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class roles',
      },
    );

    const roles = await this.roleRepo.find({
      where: {
        classId,
        workspaceId: IsNull(),
        isSystem: false,
      },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
      order: {
        name: 'ASC',
      },
    });

    return roles.map((role) =>
      CustomRoleResponseDto.fromEntity(role, this.buildPermissionKeys(role)),
    );
  }

  async ensureDefaultClassStudentRole(classId: string): Promise<Role> {
    const permissions = await Promise.all(
      this.defaultClassStudentPermissionKeys.map((key) =>
        this.findPermissionByKey(key),
      ),
    );

    const role = await this.roleRepo.manager.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const rolePermissionRepo = manager.getRepository(RolePermission);

      let defaultRole = await roleRepo.findOne({
        where: {
          name: this.defaultClassStudentRoleName,
          classId,
          workspaceId: IsNull(),
          isSystem: false,
        },
        relations: {
          rolePermissions: {
            permission: true,
          },
        },
      });

      if (!defaultRole) {
        defaultRole = roleRepo.create({
          name: this.defaultClassStudentRoleName,
          description: 'Default class student role',
          isSystem: false,
          workspaceId: null,
          classId,
        });
        defaultRole = await roleRepo.save(defaultRole);
      }

      const existingPermissionKeys = new Set(
        (defaultRole.rolePermissions ?? []).map(
          (rolePermission) =>
            `${rolePermission.permission.action}:${rolePermission.permission.resource}`,
        ),
      );

      for (const permission of permissions) {
        const permissionKey = `${permission.action}:${permission.resource}`;
        if (existingPermissionKeys.has(permissionKey)) {
          continue;
        }

        const rolePermission = rolePermissionRepo.create({
          role: defaultRole,
          permission,
        });
        await rolePermissionRepo.save(rolePermission);
      }

      return defaultRole;
    });

    await this.assignDefaultRoleToStudentsWithoutClassRole(classId, role.id);
    return this.loadRoleWithPermissions(role.id);
  }

  async updateClassCustomRole(
    classId: string,
    roleId: string,
    dto: UpdateCustomRoleDto,
    actorUserId: string,
  ): Promise<CustomRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        ownerForbiddenMessage: 'Only workspace owner can manage class roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class roles',
      },
    );

    const role = await this.findClassCustomRoleOrThrow(classId, roleId);
    this.assertMutableClassRole(role);
    await this.applyRoleUpdates(role, dto, {
      roleNameConflictMessage: 'Role name already exists in this class',
      scope: 'class',
    });

    const updatedRole = await this.loadRoleWithPermissions(role.id);
    return CustomRoleResponseDto.fromEntity(
      updatedRole,
      this.buildPermissionKeys(updatedRole),
    );
  }

  async deleteClassCustomRole(
    classId: string,
    roleId: string,
    actorUserId: string,
  ): Promise<DeleteRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        ownerForbiddenMessage: 'Only workspace owner can manage class roles',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class roles',
      },
    );

    const role = await this.findClassCustomRoleOrThrow(classId, roleId);
    this.assertMutableClassRole(role);
    const assignmentCount = await this.classStudentRepo.count({
      where: {
        role: { id: role.id },
      },
    });
    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete class role while it is still assigned to class students',
      );
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('role_permissions')
        .where('"roleId" = :roleId', { roleId: role.id })
        .execute();

      await manager.getRepository(Role).delete(role.id);
    });

    return DeleteRoleResponseDto.fromData({
      roleId: role.id,
      workspaceId: null,
      classId,
    });
  }

  private buildPermissionKeys(role: Role): string[] {
    return (role.rolePermissions ?? [])
      .map((rolePermission) => rolePermission.permission)
      .filter((permission): permission is Permission => Boolean(permission))
      .map((permission) => `${permission.action}:${permission.resource}`)
      .sort();
  }

  private async seedDefaultClassStudentRoles(): Promise<void> {
    const classes = await this.classRepo.find({
      select: {
        id: true,
      },
    });

    for (const classEntity of classes) {
      await this.ensureDefaultClassStudentRole(classEntity.id);
    }
  }

  private async applyRoleUpdates(
    role: Role,
    dto: UpdateCustomRoleDto,
    options: {
      roleNameConflictMessage: string;
      scope: 'workspace' | 'class';
    },
  ): Promise<void> {
    if (dto.name !== undefined) {
      const normalizedName = dto.name.trim();

      if (!normalizedName) {
        throw new BadRequestException('Role name can not be empty');
      }

      await this.ensureRoleNameDoesNotConflictWithSystemRole(normalizedName);

      if (options.scope === 'workspace') {
        await this.ensureWorkspaceRoleNameAvailable(
          role.workspaceId as string,
          normalizedName,
          role.id,
          options.roleNameConflictMessage,
        );
      } else {
        await this.ensureClassRoleNameAvailable(
          role.classId as string,
          normalizedName,
          role.id,
          options.roleNameConflictMessage,
        );
      }

      role.name = normalizedName;
    }

    if (dto.description !== undefined) {
      role.description = dto.description.trim() || null;
    }

    const permissionKeys = this.normalizePermissionKeys(dto.permissionKeys);

    await this.roleRepo.manager.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const rolePermissionRepo = manager.getRepository(RolePermission);

      await roleRepo.save(role);

      if (permissionKeys !== undefined) {
        const permissions = await Promise.all(
          permissionKeys.map((key) => this.findPermissionByKey(key)),
        );

        await manager
          .createQueryBuilder()
          .delete()
          .from('role_permissions')
          .where('"roleId" = :roleId', { roleId: role.id })
          .execute();

        for (const permission of permissions) {
          const rolePermission = rolePermissionRepo.create({
            role,
            permission,
          });
          await rolePermissionRepo.save(rolePermission);
        }
      }
    });
  }

  private async findWorkspaceCustomRoleOrThrow(
    workspaceId: string,
    roleId: string,
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
        workspaceId,
        classId: IsNull(),
        isSystem: false,
      },
    });
    if (!role) {
      throw new BadRequestException('Workspace custom role not found');
    }

    return role;
  }

  private async findClassCustomRoleOrThrow(
    classId: string,
    roleId: string,
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
        classId,
        workspaceId: IsNull(),
        isSystem: false,
      },
    });
    if (!role) {
      throw new BadRequestException('Class custom role not found');
    }

    return role;
  }

  private async assignDefaultRoleToStudentsWithoutClassRole(
    classId: string,
    roleId: string,
  ): Promise<void> {
    const assignments = await this.classStudentRepo
      .createQueryBuilder('classStudent')
      .where('"classId" = :classId', { classId })
      .andWhere('"roleId" IS NULL')
      .getMany();
    if (assignments.length === 0) {
      return;
    }

    const role = await this.roleRepo.findOne({
      where: { id: roleId },
    });
    if (!role) {
      throw new BadRequestException('Default class role not found');
    }

    for (const assignment of assignments) {
      assignment.role = role;
    }

    await this.classStudentRepo.save(assignments);
  }

  private assertMutableClassRole(role: Role): void {
    if (role.classId && role.name === this.defaultClassStudentRoleName) {
      throw new BadRequestException(
        'Default class student role can not be updated or deleted',
      );
    }
  }

  private async ensureRoleNameDoesNotConflictWithSystemRole(
    roleName: string,
  ): Promise<void> {
    const systemRole = await this.roleRepo.findOne({
      where: {
        name: roleName,
        isSystem: true,
        workspaceId: IsNull(),
        classId: IsNull(),
      },
    });
    if (systemRole) {
      throw new BadRequestException(
        'Role name conflicts with reserved system role',
      );
    }
  }

  private async ensureWorkspaceRoleNameAvailable(
    workspaceId: string,
    roleName: string,
    excludeRoleId?: string,
    conflictMessage = 'Role name already exists in this workspace',
  ): Promise<void> {
    const existingRole = await this.roleRepo.findOne({
      where: {
        name: roleName,
        workspaceId,
        classId: IsNull(),
        isSystem: false,
        ...(excludeRoleId ? { id: Not(excludeRoleId) } : {}),
      },
    });
    if (existingRole) {
      throw new BadRequestException(conflictMessage);
    }
  }

  private async ensureClassRoleNameAvailable(
    classId: string,
    roleName: string,
    excludeRoleId?: string,
    conflictMessage = 'Role name already exists in this class',
  ): Promise<void> {
    const existingRole = await this.roleRepo.findOne({
      where: {
        name: roleName,
        classId,
        workspaceId: IsNull(),
        isSystem: false,
        ...(excludeRoleId ? { id: Not(excludeRoleId) } : {}),
      },
    });
    if (existingRole) {
      throw new BadRequestException(conflictMessage);
    }
  }

  private normalizePermissionKeys(permissionKeys?: string[]): string[] | undefined {
    if (permissionKeys === undefined) {
      return undefined;
    }

    return [...new Set(permissionKeys.map((key) => key.trim()))];
  }

  private async loadRoleWithPermissions(roleId: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
      },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    return role;
  }

  private throwUnsupportedScopeType(scopeType: never): never {
    throw new BadRequestException(`Unsupported RBAC scope type: ${String(scopeType)}`);
  }
}
