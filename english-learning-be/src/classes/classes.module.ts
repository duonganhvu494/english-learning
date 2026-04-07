import { EventEmitterModule } from '@nestjs/event-emitter';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacModule } from 'src/rbac/rbac.module';
import { Role } from 'src/rbac/entities/role.entity';
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';
import { WorkspaceEntitlementModule } from 'src/workspaces/workspace-entitlement.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { Permission } from 'src/rbac/entities/permission.entity';
import { RolePermission } from 'src/rbac/entities/role-permission.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassEntity } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';

@Module({
  imports: [
    EventEmitterModule,
    RbacModule,
    WorkspacesModule,
    WorkspaceEntitlementModule,
    TypeOrmModule.forFeature([
      ClassEntity,
      ClassStudent,
      Role,
      Permission,
      RolePermission,
      WorkspaceMember,
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
