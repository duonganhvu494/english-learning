// src/rbac/rbac.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RbacService } from './rbac.service';
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { User } from 'src/users/entities/user.entity';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { RbacController } from './rbac.controller';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { WorkspaceAccessService } from './workspace-access.service';
import { ClassRolesController } from './class-roles.controller';
import { SessionEntity } from 'src/sessions/entities/session.entity';

@Module({
  controllers: [RbacController, ClassRolesController],
  imports: [
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
    ]),
  ],
  providers: [RbacService, RbacPermissionGuard, WorkspaceAccessService],
  exports: [
    TypeOrmModule,
    RbacService,
    RbacPermissionGuard,
    WorkspaceAccessService,
  ],
})
export class RbacModule {}
