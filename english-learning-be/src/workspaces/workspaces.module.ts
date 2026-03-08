// src/workspaces/workspaces.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      User,
      Role,
      ClassEntity,
      ClassStudent,
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
