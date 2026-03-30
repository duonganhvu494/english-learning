// src/workspaces/workspaces.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { WorkspacePlansService } from './workspace-plans.service';
import { WorkspaceEntitlementModule } from './workspace-entitlement.module';
import { WorkspacesController } from './workspaces.controller';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceSubscription } from './entities/workspace-subscription.entity';
import { Plan } from './entities/plan.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { WorkspaceStudentsService } from './workspace-students.service';

@Module({
  imports: [
    RbacModule,
    WorkspaceEntitlementModule,
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      WorkspaceSubscription,
      Plan,
      PlanFeature,
      User,
      Role,
      ClassEntity,
      ClassStudent,
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspacePlansService, WorkspaceStudentsService],
  exports: [WorkspaceStudentsService],
})
export class WorkspacesModule {}
