import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";

import { ClassStudent } from "src/classes/entities/class-student.entity";
import { User } from "src/users/entities/user.entity";
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from "src/workspaces/entities/workspace-member.entity";

import { CreateClassRoleDto } from "./dto/create-class-role.dto";
import { CreateCustomRoleDto } from "./dto/create-custom-role.dto";
import { CustomRoleResponseDto } from "./dto/custom-role-response.dto";
import { DeleteRoleResponseDto } from "./dto/delete-role-response.dto";
import { PermissionResponseDto } from "./dto/permission-response.dto";
import { UpdateCustomRoleDto } from "./dto/update-custom-role.dto";

import { Permission } from "./entities/permission.entity";
import { RolePermission } from "./entities/role-permission.entity";
import { Role } from "./entities/role.entity";

import { RbacScopeType } from "./interfaces/scope-options.interface";
import { WorkspaceAccessService } from "./workspace-access.service";

import { errorPayload } from "src/common/utils/error-payload.util";
import { PLAN_FEATURE_KEYS } from "src/plans/constants/plan-feature-key.constants";
import { WorkspaceEntitlementService } from "src/workspaces/workspace-entitlement.service";

import {
  DEFAULT_CLASS_STUDENT_PERMISSION_KEYS,
  DEFAULT_CLASS_STUDENT_ROLE_NAME,
} from "./seeds/rbac-system.seed";

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
export class RbacService {
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

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly workspaceAccessService: WorkspaceAccessService,

    private readonly workspaceEntitlementService: WorkspaceEntitlementService,
  ) {}

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
      (rolePermission) =>
        rolePermission.permission.action === input.action &&
        rolePermission.permission.resource === input.resource,
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
    const user = await this.userRepo.findOne({
      where: {
        id: input.userId,
      },
    });

    if (!user) {
      return null;
    }

    if (user.isSuperAdmin) {
      return this.roleRepo.findOne({
        where: {
          name: "owner",
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

    if (input.scopeType === "workspace") {
      const member = await this.memberRepo.findOne({
        where: {
          workspace: {
            id: input.scopeId,
          },
          user: {
            id: input.userId,
          },
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

    if (input.scopeType === "class") {
      const classStudent = await this.classStudentRepo.findOne({
        where: {
          classEntity: {
            id: input.scopeId,
          },
          student: {
            id: input.userId,
          },
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
  ): Promise<CustomRoleResponseDto> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    await this.workspaceEntitlementService.assertFeatureEnabled(
      workspaceId,
      PLAN_FEATURE_KEYS.CUSTOM_ROLES,
    );

    const normalizedName = dto.name.trim();
    const normalizedDescription = dto.description?.trim() || undefined;

    if (!normalizedName) {
      this.throwBadRequest(
        "Role name can not be empty",
        "RBAC_ROLE_NAME_REQUIRED",
      );
    }

    const permissionKeys =
      this.normalizePermissionKeys(dto.permissionKeys) ?? [];

    await this.ensureRoleNameDoesNotConflictWithSystemRole(normalizedName);

    await this.ensureWorkspaceRoleNameAvailable(workspaceId, normalizedName);

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

  async listPermissions(workspaceId: string): Promise<PermissionResponseDto[]> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const permissions = await this.permissionRepo.find({
      order: {
        action: "ASC",
        resource: "ASC",
      },
    });

    return permissions.map((permission) =>
      PermissionResponseDto.fromEntity(permission),
    );
  }

  async listCustomRoles(workspaceId: string): Promise<CustomRoleResponseDto[]> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

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
        name: "ASC",
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
  ): Promise<CustomRoleResponseDto> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    await this.workspaceEntitlementService.assertFeatureEnabled(
      workspaceId,
      PLAN_FEATURE_KEYS.CUSTOM_ROLES,
    );

    const role = await this.findWorkspaceCustomRoleOrThrow(workspaceId, roleId);

    await this.applyRoleUpdates(role, dto, {
      roleNameConflictMessage: "Role name already exists in this workspace",
      scope: "workspace",
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
  ): Promise<DeleteRoleResponseDto> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    await this.workspaceEntitlementService.assertFeatureEnabled(
      workspaceId,
      PLAN_FEATURE_KEYS.CUSTOM_ROLES,
    );

    const role = await this.findWorkspaceCustomRoleOrThrow(workspaceId, roleId);

    const assignmentCount = await this.memberRepo.count({
      where: {
        role: {
          id: role.id,
        },
      },
    });

    if (assignmentCount > 0) {
      this.throwBadRequest(
        "Cannot delete workspace role while it is still assigned to members",
        "RBAC_WORKSPACE_CUSTOM_ROLE_ASSIGNED",
      );
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(RolePermission)
        .where('"roleId" = :roleId', {
          roleId: role.id,
        })
        .execute();

      await manager.getRepository(Role).delete(role.id);
    });

    return DeleteRoleResponseDto.fromData({
      roleId: role.id,
      workspaceId,
      classId: null,
    });
  }

  async createClassCustomRole(
    classId: string,
    dto: CreateClassRoleDto,
  ): Promise<CustomRoleResponseDto> {
    const classEntity =
      await this.workspaceAccessService.getClassOrThrow(classId);

    await this.workspaceEntitlementService.assertFeatureEnabled(
      classEntity.workspace.id,
      PLAN_FEATURE_KEYS.CUSTOM_ROLES,
    );

    const normalizedName = dto.name.trim();
    const normalizedDescription = dto.description?.trim() || undefined;

    if (!normalizedName) {
      this.throwBadRequest(
        "Role name can not be empty",
        "RBAC_ROLE_NAME_REQUIRED",
      );
    }

    const permissionKeys =
      this.normalizePermissionKeys(dto.permissionKeys) ?? [];

    await this.ensureRoleNameDoesNotConflictWithSystemRole(normalizedName);

    await this.ensureClassRoleNameAvailable(classId, normalizedName);

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
  ): Promise<CustomRoleResponseDto[]> {
    await this.workspaceAccessService.getClassOrThrow(classId);

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
        name: "ASC",
      },
    });

    return roles.map((role) =>
      CustomRoleResponseDto.fromEntity(role, this.buildPermissionKeys(role)),
    );
  }

  async updateClassCustomRole(
    classId: string,
    roleId: string,
    dto: UpdateCustomRoleDto,
  ): Promise<CustomRoleResponseDto> {
    const classEntity =
      await this.workspaceAccessService.getClassOrThrow(classId);

    await this.workspaceEntitlementService.assertFeatureEnabled(
      classEntity.workspace.id,
      PLAN_FEATURE_KEYS.CUSTOM_ROLES,
    );

    const role = await this.findClassCustomRoleOrThrow(classId, roleId);

    this.assertMutableClassRole(role);

    await this.applyRoleUpdates(role, dto, {
      roleNameConflictMessage: "Role name already exists in this class",
      scope: "class",
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
  ): Promise<DeleteRoleResponseDto> {
    const classEntity =
      await this.workspaceAccessService.getClassOrThrow(classId);

    await this.workspaceEntitlementService.assertFeatureEnabled(
      classEntity.workspace.id,
      PLAN_FEATURE_KEYS.CUSTOM_ROLES,
    );

    const role = await this.findClassCustomRoleOrThrow(classId, roleId);

    this.assertMutableClassRole(role);

    const assignmentCount = await this.classStudentRepo.count({
      where: {
        role: {
          id: role.id,
        },
      },
    });

    if (assignmentCount > 0) {
      this.throwBadRequest(
        "Cannot delete class role while it is still assigned to class students",
        "RBAC_CLASS_CUSTOM_ROLE_ASSIGNED",
      );
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(RolePermission)
        .where('"roleId" = :roleId', {
          roleId: role.id,
        })
        .execute();

      await manager.getRepository(Role).delete(role.id);
    });

    return DeleteRoleResponseDto.fromData({
      roleId: role.id,
      workspaceId: null,
      classId,
    });
  }

  async ensureDefaultClassStudentRole(classId: string): Promise<Role> {
    const permissions = await Promise.all(
      DEFAULT_CLASS_STUDENT_PERMISSION_KEYS.map((key) =>
        this.findPermissionByKey(key),
      ),
    );

    const role = await this.roleRepo.manager.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const rolePermissionRepo = manager.getRepository(RolePermission);

      let defaultRole = await roleRepo.findOne({
        where: {
          name: DEFAULT_CLASS_STUDENT_ROLE_NAME,
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
          name: DEFAULT_CLASS_STUDENT_ROLE_NAME,
          description: "Default class student role",
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

  private async findPermissionByKey(key: string): Promise<Permission> {
    const [action, resource, extra] = key.split(":");

    if (!action || !resource || extra) {
      this.throwBadRequest(
        `Invalid permission key: ${key}`,
        "RBAC_PERMISSION_KEY_INVALID",
      );
    }

    const permission = await this.permissionRepo.findOne({
      where: {
        action,
        resource,
      },
    });

    if (!permission) {
      this.throwBadRequest(
        `Permission not found: ${key}`,
        "RBAC_PERMISSION_NOT_FOUND",
      );
    }

    return permission;
  }

  private buildPermissionKeys(role: Role): string[] {
    return (role.rolePermissions ?? [])
      .map((rolePermission) => rolePermission.permission)
      .filter((permission): permission is Permission => Boolean(permission))
      .map((permission) => `${permission.action}:${permission.resource}`)
      .sort();
  }

  private async applyRoleUpdates(
    role: Role,
    dto: UpdateCustomRoleDto,
    options: {
      roleNameConflictMessage: string;
      scope: "workspace" | "class";
    },
  ): Promise<void> {
    if (dto.name !== undefined) {
      const normalizedName = dto.name.trim();

      if (!normalizedName) {
        this.throwBadRequest(
          "Role name can not be empty",
          "RBAC_ROLE_NAME_REQUIRED",
        );
      }

      await this.ensureRoleNameDoesNotConflictWithSystemRole(normalizedName);

      if (options.scope === "workspace") {
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

    let permissions: Permission[] | undefined;

    if (permissionKeys !== undefined) {
      permissions = await Promise.all(
        permissionKeys.map((key) => this.findPermissionByKey(key)),
      );
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const rolePermissionRepo = manager.getRepository(RolePermission);

      await roleRepo.save(role);

      if (permissions !== undefined) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(RolePermission)
          .where('"roleId" = :roleId', {
            roleId: role.id,
          })
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
      this.throwBadRequest(
        "Workspace custom role not found",
        "RBAC_WORKSPACE_CUSTOM_ROLE_NOT_FOUND",
      );
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
      this.throwBadRequest(
        "Class custom role not found",
        "RBAC_CLASS_CUSTOM_ROLE_NOT_FOUND",
      );
    }

    return role;
  }

  private async assignDefaultRoleToStudentsWithoutClassRole(
    classId: string,
    roleId: string,
  ): Promise<void> {
    const assignments = await this.classStudentRepo
      .createQueryBuilder("classStudent")
      .where('"classId" = :classId', {
        classId,
      })
      .andWhere('"roleId" IS NULL')
      .getMany();

    if (assignments.length === 0) {
      return;
    }

    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      this.throwBadRequest(
        "Default class role not found",
        "RBAC_DEFAULT_CLASS_ROLE_NOT_FOUND",
      );
    }

    for (const assignment of assignments) {
      assignment.role = role;
    }

    await this.classStudentRepo.save(assignments);
  }

  private assertMutableClassRole(role: Role): void {
    if (role.classId && role.name === DEFAULT_CLASS_STUDENT_ROLE_NAME) {
      this.throwBadRequest(
        "Default class student role can not be updated or deleted",
        "RBAC_DEFAULT_CLASS_ROLE_IMMUTABLE",
      );
    }
  }

  private async ensureRoleNameDoesNotConflictWithSystemRole(
    roleName: string,
  ): Promise<void> {
    const systemRole = await this.roleRepo
      .createQueryBuilder("role")
      .where("role.isSystem = :isSystem", {
        isSystem: true,
      })
      .andWhere("role.workspaceId IS NULL")
      .andWhere("role.classId IS NULL")
      .andWhere("LOWER(role.name) = LOWER(:roleName)", {
        roleName,
      })
      .getOne();

    if (systemRole) {
      this.throwBadRequest(
        "Role name conflicts with reserved system role",
        "RBAC_ROLE_NAME_CONFLICTS_SYSTEM",
      );
    }
  }

  private async ensureWorkspaceRoleNameAvailable(
    workspaceId: string,
    roleName: string,
    excludeRoleId?: string,
    conflictMessage = "Role name already exists in this workspace",
    conflictCode = "RBAC_WORKSPACE_ROLE_NAME_EXISTS",
  ): Promise<void> {
    const query = this.roleRepo
      .createQueryBuilder("role")
      .where("role.workspaceId = :workspaceId", {
        workspaceId,
      })
      .andWhere("role.classId IS NULL")
      .andWhere("role.isSystem = :isSystem", {
        isSystem: false,
      })
      .andWhere("LOWER(role.name) = LOWER(:roleName)", {
        roleName,
      });

    if (excludeRoleId) {
      query.andWhere("role.id != :excludeRoleId", {
        excludeRoleId,
      });
    }

    const existingRole = await query.getOne();

    if (existingRole) {
      this.throwBadRequest(conflictMessage, conflictCode);
    }
  }

  private async ensureClassRoleNameAvailable(
    classId: string,
    roleName: string,
    excludeRoleId?: string,
    conflictMessage = "Role name already exists in this class",
    conflictCode = "RBAC_CLASS_ROLE_NAME_EXISTS",
  ): Promise<void> {
    const query = this.roleRepo
      .createQueryBuilder("role")
      .where("role.classId = :classId", {
        classId,
      })
      .andWhere("role.workspaceId IS NULL")
      .andWhere("role.isSystem = :isSystem", {
        isSystem: false,
      })
      .andWhere("LOWER(role.name) = LOWER(:roleName)", {
        roleName,
      });

    if (excludeRoleId) {
      query.andWhere("role.id != :excludeRoleId", {
        excludeRoleId,
      });
    }

    const existingRole = await query.getOne();

    if (existingRole) {
      this.throwBadRequest(conflictMessage, conflictCode);
    }
  }

  private normalizePermissionKeys(
    permissionKeys?: string[],
  ): string[] | undefined {
    if (permissionKeys === undefined) {
      return undefined;
    }

    return [
      ...new Set(permissionKeys.map((key) => key.trim()).filter(Boolean)),
    ];
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
      this.throwBadRequest("Role not found", "RBAC_ROLE_NOT_FOUND");
    }

    return role;
  }

  private throwBadRequest(message: string, code: string): never {
    throw new BadRequestException(errorPayload(message, code));
  }

  private throwUnsupportedScopeType(scopeType: never): never {
    throw new BadRequestException(
      errorPayload(
        `Unsupported RBAC scope type: ${String(scopeType)}`,
        "RBAC_SCOPE_TYPE_UNSUPPORTED",
      ),
    );
  }
}
