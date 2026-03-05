// src/rbac/rbac.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RbacService } from './rbac.service';
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';
import { User } from 'src/users/entities/user.entity';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      WorkspaceMember,
      User,
    ]),
  ],
  providers: [RbacService, RbacPermissionGuard],
  exports: [TypeOrmModule, RbacService, RbacPermissionGuard],
})
export class RbacModule {}
