import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { AccountType } from 'src/users/entities/user.entity';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from './entities/workspace-member.entity';
import {
  PlanFeature,
  PlanFeatureValueType,
} from './entities/plan-feature.entity';
import {
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from './entities/workspace-subscription.entity';
import {
  WORKSPACE_PLAN_FEATURE_KEYS,
  WorkspacePlanFeatureKey,
} from './constants/workspace-plan-feature-key.constants';

@Injectable()
export class WorkspaceEntitlementService {
  constructor(
    @InjectRepository(WorkspaceSubscription)
    private readonly workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,

    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
  ) {}

  async assertFeatureEnabled(
    workspaceId: string,
    featureKey: WorkspacePlanFeatureKey,
  ): Promise<void> {
    const feature = await this.getFeatureOrThrow(workspaceId, featureKey);

    if (
      feature.valueType !== PlanFeatureValueType.BOOLEAN ||
      feature.booleanValue !== true
    ) {
      throw new ForbiddenException(
        errorPayload(
          this.getDisabledFeatureMessage(featureKey),
          this.getDisabledFeatureCode(featureKey),
        ),
      );
    }
  }

  async assertStudentQuotaAvailable(workspaceId: string): Promise<void> {
    const studentLimit = await this.getNumberFeatureOrThrow(
      workspaceId,
      WORKSPACE_PLAN_FEATURE_KEYS.MAX_STUDENTS,
    );
    const activeStudentCount = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.user', 'user')
      .innerJoin('member.workspace', 'workspace')
      .where('workspace.id = :workspaceId', { workspaceId })
      .andWhere('member.status = :status', {
        status: WorkspaceMemberStatus.ACTIVE,
      })
      .andWhere('user.accountType = :accountType', {
        accountType: AccountType.STUDENT,
      })
      .getCount();

    if (activeStudentCount >= studentLimit) {
      throw new ForbiddenException(
        errorPayload(
          `Current workspace plan allows up to ${studentLimit} students`,
          'WORKSPACE_PLAN_MAX_STUDENTS_REACHED',
        ),
      );
    }
  }

  async assertClassQuotaAvailable(workspaceId: string): Promise<void> {
    const classLimit = await this.getNumberFeatureOrThrow(
      workspaceId,
      WORKSPACE_PLAN_FEATURE_KEYS.MAX_CLASSES,
    );
    const currentClassCount = await this.classRepo.count({
      where: {
        workspace: { id: workspaceId },
      },
    });

    if (currentClassCount >= classLimit) {
      throw new ForbiddenException(
        errorPayload(
          `Current workspace plan allows up to ${classLimit} classes`,
          'WORKSPACE_PLAN_MAX_CLASSES_REACHED',
        ),
      );
    }
  }

  private async getFeatureOrThrow(
    workspaceId: string,
    featureKey: WorkspacePlanFeatureKey,
  ): Promise<PlanFeature> {
    const subscription = await this.getCurrentSubscriptionOrThrow(workspaceId);
    const feature = subscription.plan.features.find(
      (planFeature) => planFeature.featureKey === featureKey,
    );

    if (!feature) {
      throw new BadRequestException(
        errorPayload(
          `Workspace plan feature is not configured: ${featureKey}`,
          'WORKSPACE_PLAN_FEATURE_NOT_CONFIGURED',
        ),
      );
    }

    return feature;
  }

  private async getNumberFeatureOrThrow(
    workspaceId: string,
    featureKey: WorkspacePlanFeatureKey,
  ): Promise<number> {
    const feature = await this.getFeatureOrThrow(workspaceId, featureKey);

    if (
      feature.valueType !== PlanFeatureValueType.NUMBER ||
      feature.numberValue === null
    ) {
      throw new BadRequestException(
        errorPayload(
          `Workspace plan feature is not configured as a number: ${featureKey}`,
          'WORKSPACE_PLAN_FEATURE_TYPE_INVALID',
        ),
      );
    }

    const parsedValue = Number(feature.numberValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new BadRequestException(
        errorPayload(
          `Workspace plan feature has an invalid numeric value: ${featureKey}`,
          'WORKSPACE_PLAN_FEATURE_VALUE_INVALID',
        ),
      );
    }

    return parsedValue;
  }

  private async getCurrentSubscriptionOrThrow(
    workspaceId: string,
  ): Promise<WorkspaceSubscription> {
    const now = new Date();
    const subscription = await this.workspaceSubscriptionRepo.findOne({
      where: [
        {
          workspace: { id: workspaceId },
          endedAt: IsNull(),
        },
        {
          workspace: { id: workspaceId },
          endedAt: MoreThan(now),
        },
      ],
      relations: {
        plan: {
          features: true,
        },
      },
      order: {
        endedAt: 'DESC',
      },
    });

    if (!subscription) {
      throw new BadRequestException(
        errorPayload(
          'Workspace subscription not found',
          'WORKSPACE_SUBSCRIPTION_NOT_FOUND',
        ),
      );
    }

    if (
      subscription.status !== WorkspaceSubscriptionStatus.ACTIVE &&
      subscription.status !== WorkspaceSubscriptionStatus.TRIALING
    ) {
      throw new ForbiddenException(
        errorPayload('Workspace plan is not active', 'WORKSPACE_PLAN_INACTIVE'),
      );
    }

    return subscription;
  }

  private getDisabledFeatureMessage(
    featureKey: WorkspacePlanFeatureKey,
  ): string {
    switch (featureKey) {
      case WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES:
        return 'Current workspace plan does not allow custom roles';
      case WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS:
        return 'Current workspace plan does not allow quiz assignments';
      default:
        return `Current workspace plan does not allow feature: ${featureKey}`;
    }
  }

  private getDisabledFeatureCode(featureKey: WorkspacePlanFeatureKey): string {
    switch (featureKey) {
      case WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES:
        return 'WORKSPACE_PLAN_CUSTOM_ROLES_DISABLED';
      case WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS:
        return 'WORKSPACE_PLAN_QUIZ_ASSIGNMENTS_DISABLED';
      default:
        return 'WORKSPACE_PLAN_FEATURE_DISABLED';
    }
  }
}
