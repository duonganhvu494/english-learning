import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceSubscription } from './entities/workspace-subscription.entity';
import { WorkspaceEntitlementService } from './workspace-entitlement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceSubscription,
      WorkspaceMember,
      ClassEntity,
    ]),
  ],
  providers: [WorkspaceEntitlementService],
  exports: [WorkspaceEntitlementService],
})
export class WorkspaceEntitlementModule {}
