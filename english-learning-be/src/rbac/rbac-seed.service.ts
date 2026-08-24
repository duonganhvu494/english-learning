import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { ClassEntity } from "src/classes/entities/class.entity";
import { ClassStudent } from "src/classes/entities/class-student.entity";

import { Permission } from "./entities/permission.entity";
import { Role } from "./entities/role.entity";
import { RolePermission } from "./entities/role-permission.entity";

import {
  DEFAULT_CLASS_STUDENT_PERMISSION_KEYS,
  DEFAULT_CLASS_STUDENT_ROLE_NAME,
  RBAC_ROLE_PERMISSION_MAP,
  RBAC_SYSTEM_PERMISSIONS,
  RBAC_SYSTEM_ROLES,
} from "./seeds/rbac-system.seed";

@Injectable()
export class RbacSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSystemRoles();
    await this.seedSystemPermissions();
    await this.seedSystemRolePermissions();
    await this.seedDefaultClassStudentRoles();
  }

  private async seedSystemRoles(): Promise<void> {
    for (const roleSeed of RBAC_SYSTEM_ROLES) {
      const existing = await this.roleRepo.findOne({
        where: {
          name: roleSeed.name,
          isSystem: true,
          workspaceId: IsNull(),
          classId: IsNull(),
        },
      });

      if (!existing) {
        const role = this.roleRepo.create({
          name: roleSeed.name,
          description: roleSeed.description,
          isSystem: true,
          workspaceId: null,
          classId: null,
        });

        await this.roleRepo.save(role);

        continue;
      }

      if (existing.description !== roleSeed.description) {
        existing.description = roleSeed.description;

        await this.roleRepo.save(existing);
      }
    }
  }

  private async seedSystemPermissions(): Promise<void> {
    for (const permissionSeed of RBAC_SYSTEM_PERMISSIONS) {
      const existing = await this.permissionRepo.findOne({
        where: {
          action: permissionSeed.action,
          resource: permissionSeed.resource,
        },
      });

      if (!existing) {
        const permission = this.permissionRepo.create({
          action: permissionSeed.action,
          resource: permissionSeed.resource,
          description: permissionSeed.description,
        });

        await this.permissionRepo.save(permission);

        continue;
      }

      if (existing.description !== permissionSeed.description) {
        existing.description = permissionSeed.description;

        await this.permissionRepo.save(existing);
      }
    }
  }

  private async seedSystemRolePermissions(): Promise<void> {
    for (const [roleName, permissionKeys] of Object.entries(
      RBAC_ROLE_PERMISSION_MAP,
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
        const [action, resource] = key.split(":");

        if (!action || !resource) {
          continue;
        }

        const permission = await this.permissionRepo.findOne({
          where: {
            action,
            resource,
          },
        });

        if (!permission) {
          continue;
        }

        const existing = await this.rolePermissionRepo.findOne({
          where: {
            role: {
              id: role.id,
            },
            permission: {
              id: permission.id,
            },
          },
        });

        if (existing) {
          continue;
        }

        await this.rolePermissionRepo.save(
          this.rolePermissionRepo.create({
            role,
            permission,
          }),
        );
      }
    }
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

  private async ensureDefaultClassStudentRole(classId: string): Promise<Role> {
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

        await rolePermissionRepo.save(
          rolePermissionRepo.create({
            role: defaultRole,
            permission,
          }),
        );
      }

      return defaultRole;
    });

    await this.assignDefaultRoleToStudentsWithoutClassRole(classId, role.id);

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
      return;
    }

    for (const assignment of assignments) {
      assignment.role = role;
    }

    await this.classStudentRepo.save(assignments);
  }

  private async findPermissionByKey(key: string): Promise<Permission> {
    const [action, resource] = key.split(":");

    if (!action || !resource) {
      throw new Error(`Invalid RBAC permission seed key: ${key}`);
    }

    const permission = await this.permissionRepo.findOne({
      where: {
        action,
        resource,
      },
    });

    if (!permission) {
      throw new Error(`RBAC permission seed not found: ${key}`);
    }

    return permission;
  }
}
