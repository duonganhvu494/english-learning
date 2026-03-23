import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';
import { Material } from 'src/materials/entities/material.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import {
  RbacScopeType,
  ScopeResourceType,
} from './interfaces/scope-options.interface';
import { errorPayload } from 'src/common/utils/error-payload.util';

interface ResourceLookupOptions {
  notFoundMessage?: string;
  notFoundCode?: string;
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

    @InjectRepository(LectureEntity)
    private readonly lectureRepo: Repository<LectureEntity>,

    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
  ) {}

  async getWorkspaceOrThrow(
    workspaceId: string,
    options?: ResourceLookupOptions,
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      relations: {
        owner: true,
      },
    });
    if (!workspace) {
      throw new BadRequestException(
        errorPayload(
          options?.notFoundMessage ?? 'Workspace not found',
          options?.notFoundCode ?? 'WORKSPACE_NOT_FOUND',
        ),
      );
    }

    return workspace;
  }

  async getClassOrThrow(
    classId: string,
    options?: ResourceLookupOptions,
  ): Promise<ClassEntity> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: {
        workspace: true,
      },
    });
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload(
          options?.notFoundMessage ?? 'Class not found',
          options?.notFoundCode ?? 'CLASS_NOT_FOUND',
        ),
      );
    }

    return classEntity;
  }

  async getSessionOrThrow(
    sessionId: string,
    options?: ResourceLookupOptions,
  ): Promise<SessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload(
          options?.notFoundMessage ?? 'Session not found',
          options?.notFoundCode ?? 'SESSION_NOT_FOUND',
        ),
      );
    }

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
          throw new BadRequestException(
            errorPayload('Class not found', 'CLASS_NOT_FOUND'),
          );
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
          throw new BadRequestException(
            errorPayload('Session not found', 'SESSION_NOT_FOUND'),
          );
        }

        if (scopeType === 'workspace') {
          return session.classEntity.workspace.id;
        }

        if (scopeType === 'class') {
          return session.classEntity.id;
        }

        return this.throwUnsupportedScopeType(scopeType);
      }
      case 'lecture': {
        const lecture = await this.lectureRepo.findOne({
          where: { id: resourceId },
          relations: {
            session: {
              classEntity: {
                workspace: true,
              },
            },
          },
        });
        if (
          !lecture?.session?.classEntity?.id ||
          !lecture.session.classEntity.workspace?.id
        ) {
          throw new BadRequestException(
            errorPayload('Lecture not found', 'LECTURE_NOT_FOUND'),
          );
        }

        if (scopeType === 'workspace') {
          return lecture.session.classEntity.workspace.id;
        }

        if (scopeType === 'class') {
          return lecture.session.classEntity.id;
        }

        return this.throwUnsupportedScopeType(scopeType);
      }
      case 'material': {
        const material = await this.materialRepo.findOne({
          where: { id: resourceId },
          relations: {
            workspace: true,
          },
        });
        if (!material?.workspace?.id) {
          throw new BadRequestException(
            errorPayload('Material not found', 'MATERIAL_NOT_FOUND'),
          );
        }

        if (scopeType === 'workspace') {
          return material.workspace.id;
        }

        throw new BadRequestException(
          errorPayload(
            `RBAC scope ${scopeType} is not supported for material resource`,
            'RBAC_SCOPE_TYPE_UNSUPPORTED_FOR_MATERIAL',
          ),
        );
      }
      case 'assignment': {
        const assignment = await this.assignmentRepo.findOne({
          where: { id: resourceId },
          relations: {
            session: {
              classEntity: {
                workspace: true,
              },
            },
          },
        });
        if (
          !assignment?.session?.classEntity?.id ||
          !assignment.session.classEntity.workspace?.id
        ) {
          throw new BadRequestException(
            errorPayload('Assignment not found', 'ASSIGNMENT_NOT_FOUND'),
          );
        }

        if (scopeType === 'workspace') {
          return assignment.session.classEntity.workspace.id;
        }

        if (scopeType === 'class') {
          return assignment.session.classEntity.id;
        }

        return this.throwUnsupportedScopeType(scopeType);
      }
      default:
        return this.throwUnsupportedScopeResource(resourceType);
    }
  }

  private throwUnsupportedScopeType(scopeType: never): never {
    throw new BadRequestException(
      errorPayload(
        `Unsupported RBAC scope type: ${String(scopeType)}`,
        'RBAC_SCOPE_TYPE_UNSUPPORTED',
      ),
    );
  }

  private throwUnsupportedScopeResource(
    resourceType: never,
  ): never {
    throw new BadRequestException(
      errorPayload(
        `Unsupported RBAC scope resource: ${String(resourceType)}`,
        'RBAC_SCOPE_RESOURCE_UNSUPPORTED',
      ),
    );
  }
}
