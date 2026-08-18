// src/workspaces/workspaces.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceEntitlementModule } from './workspace-entitlement.module';
import { WorkspacesController } from './workspaces.controller';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceSubscription } from './entities/workspace-subscription.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { MailModule } from 'src/mail/mail.module';
import { WorkspaceStudentsService } from './workspace-students.service';
import { PlansModule } from 'src/plans/plans.module';

@Module({
  imports: [
    MailModule,
    RbacModule,
    PlansModule,
    WorkspaceEntitlementModule,
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      WorkspaceSubscription,
      User,
      Role,
      ClassEntity,
      ClassStudent,
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceStudentsService],
  exports: [WorkspaceStudentsService],
})
export class WorkspacesModule {}
