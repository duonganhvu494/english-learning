import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { WORKSPACE_PLAN_FEATURE_KEYS } from './constants/workspace-plan-feature-key.constants';
import { PlanFeatureValueType } from './entities/plan-feature.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import {
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from './entities/workspace-subscription.entity';
import { WorkspaceEntitlementService } from './workspace-entitlement.service';

describe('WorkspaceEntitlementService', () => {
  let service: WorkspaceEntitlementService;

  const workspaceSubscriptionRepo = {
    findOne: jest.fn(),
  };
  const memberRepo = {
    createQueryBuilder: jest.fn(),
  };
  const classRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceEntitlementService,
        {
          provide: getRepositoryToken(WorkspaceSubscription),
          useValue: workspaceSubscriptionRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: memberRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
      ],
    }).compile();

    service = module.get<WorkspaceEntitlementService>(
      WorkspaceEntitlementService,
    );
  });

  function mockCurrentSubscription(features: {
    featureKey: string;
    valueType: PlanFeatureValueType;
    booleanValue?: boolean | null;
    numberValue?: string | null;
  }[]) {
    workspaceSubscriptionRepo.findOne.mockResolvedValue({
      id: 'subscription-1',
      status: WorkspaceSubscriptionStatus.ACTIVE,
      plan: {
        id: 'plan-free',
        features: features.map((feature) => ({
          ...feature,
          booleanValue: feature.booleanValue ?? null,
          numberValue: feature.numberValue ?? null,
          stringValue: null,
          jsonValue: null,
        })),
      },
    });
  }

  it('allows an enabled boolean feature', async () => {
    mockCurrentSubscription([
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: true,
      },
    ]);

    await expect(
      service.assertFeatureEnabled(
        'workspace-1',
        WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES,
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects a disabled boolean feature', async () => {
    mockCurrentSubscription([
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: false,
      },
    ]);

    await expect(
      service.assertFeatureEnabled(
        'workspace-1',
        WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when the student quota has been reached', async () => {
    mockCurrentSubscription([
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_STUDENTS,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: '30',
      },
    ]);
    memberRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(30),
    });

    await expect(
      service.assertStudentQuotaAvailable('workspace-1'),
    ).rejects.toThrow(
      new ForbiddenException('Current workspace plan allows up to 30 students'),
    );
  });

  it('rejects when the class quota has been reached', async () => {
    mockCurrentSubscription([
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_CLASSES,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: '3',
      },
    ]);
    classRepo.count.mockResolvedValue(3);

    await expect(
      service.assertClassQuotaAvailable('workspace-1'),
    ).rejects.toThrow(
      new ForbiddenException('Current workspace plan allows up to 3 classes'),
    );
  });
});
