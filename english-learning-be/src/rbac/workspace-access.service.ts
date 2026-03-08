import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType } from 'src/users/entities/user.entity';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import {
  RbacScopeType,
  ScopeResourceType,
} from './interfaces/scope-options.interface';

interface TeacherWorkspaceOwnerAssertionOptions {
  notFoundMessage?: string;
  ownerForbiddenMessage?: string;
  teacherForbiddenMessage?: string;
}

@Injectable()
export class WorkspaceAccessService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
  ) {}

  async assertTeacherWorkspaceOwner(
    workspaceId: string,
    actorUserId: string,
    options?: TeacherWorkspaceOwnerAssertionOptions,
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      relations: {
        owner: true,
      },
    });
    if (!workspace) {
      throw new BadRequestException(
        options?.notFoundMessage ?? 'Workspace not found',
      );
    }

    this.ensureTeacherWorkspaceOwner(workspace, actorUserId, options);
    return workspace;
  }

  async assertTeacherClassOwner(
    classId: string,
    actorUserId: string,
    options?: TeacherWorkspaceOwnerAssertionOptions,
  ): Promise<ClassEntity> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: {
        workspace: {
          owner: true,
        },
      },
    });
    if (!classEntity) {
      throw new BadRequestException(options?.notFoundMessage ?? 'Class not found');
    }

    this.ensureTeacherWorkspaceOwner(
      classEntity.workspace,
      actorUserId,
      options,
    );
    return classEntity;
  }

  async assertTeacherSessionOwner(
    sessionId: string,
    actorUserId: string,
    options?: TeacherWorkspaceOwnerAssertionOptions,
  ): Promise<SessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: {
            owner: true,
          },
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        options?.notFoundMessage ?? 'Session not found',
      );
    }

    this.ensureTeacherWorkspaceOwner(
      session.classEntity.workspace,
      actorUserId,
      options,
    );
    return session;
  }

  async resolveScopeIdByResource(
    scopeType: RbacScopeType,
    resourceType: ScopeResourceType,
    resourceId: string,
  ): Promise<string> {
    switch (resourceType) {
      case 'class': {
        const classEntity = await this.classRepo.findOne({
          where: { id: resourceId },
          relations: {
            workspace: true,
          },
        });
        if (!classEntity?.workspace?.id) {
          throw new BadRequestException('Class not found');
        }

        if (scopeType === 'workspace') {
          return classEntity.workspace.id;
        }

        if (scopeType === 'class') {
          return classEntity.id;
        }

        return this.throwUnsupportedScopeType(scopeType);
      }
      case 'session': {
        const session = await this.sessionRepo.findOne({
          where: { id: resourceId },
          relations: {
            classEntity: {
              workspace: true,
            },
          },
        });
        if (!session?.classEntity?.id || !session.classEntity.workspace?.id) {
          throw new BadRequestException('Session not found');
        }

        if (scopeType === 'workspace') {
          return session.classEntity.workspace.id;
        }

        if (scopeType === 'class') {
          return session.classEntity.id;
        }

        return this.throwUnsupportedScopeType(scopeType);
      }
      default:
        return this.throwUnsupportedScopeResource(resourceType);
    }
  }

  private ensureTeacherWorkspaceOwner(
    workspace: Workspace,
    actorUserId: string,
    options?: TeacherWorkspaceOwnerAssertionOptions,
  ) {
    if (workspace.owner.id !== actorUserId) {
      throw new ForbiddenException(
        options?.ownerForbiddenMessage ??
          'Only workspace owner can access this resource',
      );
    }

    if (workspace.owner.accountType !== AccountType.TEACHER) {
      throw new ForbiddenException(
        options?.teacherForbiddenMessage ??
          'Only teacher workspace owner can access this resource',
      );
    }
  }

  private throwUnsupportedScopeType(scopeType: never): never {
    throw new BadRequestException(`Unsupported RBAC scope type: ${String(scopeType)}`);
  }

  private throwUnsupportedScopeResource(
    resourceType: never,
  ): never {
    throw new BadRequestException(
      `Unsupported RBAC scope resource: ${String(resourceType)}`,
    );
  }
}
