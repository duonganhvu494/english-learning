import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WorkspaceEntitlementModule } from "src/workspaces/workspace-entitlement.module";

import { WorkspaceMember } from "src/workspaces/entities/workspace-member.entity";
import { Workspace } from "src/workspaces/entities/workspace.entity";
import { User } from "src/users/entities/user.entity";

import { ClassEntity } from "src/classes/entities/class.entity";
import { ClassStudent } from "src/classes/entities/class-student.entity";

import { SessionEntity } from "src/sessions/entities/session.entity";
import { LectureEntity } from "src/lectures/entities/lecture.entity";
import { AssignmentEntity } from "src/assignments/entities/assignment.entity";
import { Material } from "src/materials/entities/material.entity";

import { Role } from "./entities/role.entity";
import { Permission } from "./entities/permission.entity";
import { RolePermission } from "./entities/role-permission.entity";

import { RbacService } from "./rbac.service";
import { RbacSeedService } from "./rbac-seed.service";
import { WorkspaceAccessService } from "./workspace-access.service";

import { RbacPermissionGuard } from "./guards/rbac-permission.guard";
import { WorkspacePlanGuard } from "./guards/workspace-plan.guard";

import { RbacController } from "./rbac.controller";
import { ClassRolesController } from "./class-roles.controller";

@Module({
  imports: [
    WorkspaceEntitlementModule,

    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,

      WorkspaceMember,
      Workspace,
      User,

      ClassEntity,
      ClassStudent,

      SessionEntity,
      LectureEntity,
      AssignmentEntity,
      Material,
    ]),
  ],

  controllers: [RbacController, ClassRolesController],

  providers: [
    RbacService,
    RbacSeedService,
    WorkspaceAccessService,
    RbacPermissionGuard,
    WorkspacePlanGuard,
  ],

  exports: [
    TypeOrmModule,
    WorkspaceEntitlementModule,

    RbacService,
    WorkspaceAccessService,

    RbacPermissionGuard,
    WorkspacePlanGuard,
  ],
})
export class RbacModule {}
