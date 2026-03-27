import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { PlanFeature, PlanFeatureValueType } from './entities/plan-feature.entity';
import { WorkspacePlansService } from './workspace-plans.service';

describe('WorkspacePlansService', () => {
  let service: WorkspacePlansService;

  const plans = new Map<string, Plan>();
  const planFeatures = new Map<string, PlanFeature>();

  const planRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const planFeatureRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    plans.clear();
    planFeatures.clear();
    jest.clearAllMocks();

    planRepo.findOne.mockImplementation(
      async (options: { where: { code: string } }) =>
        plans.get(options.where.code) ?? null,
    );
    planRepo.find.mockImplementation(
      async (options: {
        where?: { isPublic?: boolean; isActive?: boolean };
      }) =>
        [...plans.values()].filter((plan) => {
          if (
            options.where?.isPublic !== undefined &&
            plan.isPublic !== options.where.isPublic
          ) {
            return false;
          }

          if (
            options.where?.isActive !== undefined &&
            plan.isActive !== options.where.isActive
          ) {
            return false;
          }

          return true;
        }).map((plan) => ({
          ...plan,
          features: [...planFeatures.values()].filter(
            (feature) => feature.plan.id === plan.id,
          ),
        }) as Plan),
    );
    planRepo.create.mockImplementation(
      (input: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => input,
    );
    planRepo.save.mockImplementation(async (input: Partial<Plan>) => {
      const savedPlan = {
        id: (input.id as string | undefined) ?? `plan-${input.code}`,
        code: input.code as string,
        name: input.name as string,
        description: (input.description ?? null) as string | null,
        monthlyPriceCents: (input.monthlyPriceCents ?? null) as number | null,
        isPublic: Boolean(input.isPublic),
        isActive: Boolean(input.isActive),
        sortOrder: input.sortOrder as number,
      } as Plan;

      plans.set(savedPlan.code, savedPlan);
      return savedPlan;
    });

    planFeatureRepo.findOne.mockImplementation(
      async (options: { where: { plan: { id: string }; featureKey: string } }) =>
        planFeatures.get(
          `${options.where.plan.id}:${options.where.featureKey}`,
        ) ?? null,
    );
    planFeatureRepo.create.mockImplementation(
      (input: Omit<PlanFeature, 'id' | 'createdAt' | 'updatedAt'>) => input,
    );
    planFeatureRepo.save.mockImplementation(async (input: Partial<PlanFeature>) => {
      const planId = input.plan?.id as string;
      const featureKey = input.featureKey as string;
      const savedFeature = {
        id: (input.id as string | undefined) ?? `feature-${planId}-${featureKey}`,
        plan: input.plan as Plan,
        featureKey,
        valueType: input.valueType as PlanFeatureValueType,
        booleanValue: (input.booleanValue ?? null) as boolean | null,
        numberValue: (input.numberValue ?? null) as string | null,
        stringValue: (input.stringValue ?? null) as string | null,
        jsonValue: (input.jsonValue ?? null) as
          | Record<string, unknown>
          | unknown[]
          | null,
      } as PlanFeature;

      planFeatures.set(`${planId}:${featureKey}`, savedFeature);
      return savedFeature;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacePlansService,
        { provide: getRepositoryToken(Plan), useValue: planRepo },
        { provide: getRepositoryToken(PlanFeature), useValue: planFeatureRepo },
      ],
    }).compile();

    service = module.get<WorkspacePlansService>(WorkspacePlansService);
  });

  it('seeds free, starter, and pro plans with their feature sets', async () => {
    await service.onModuleInit();

    expect(plans.size).toBe(3);
    expect(planFeatures.size).toBe(12);

    expect(plans.get('free')).toEqual(
      expect.objectContaining({
        code: 'free',
        name: 'Free',
        sortOrder: 1,
      }),
    );
    expect(planFeatures.get('plan-free:max_students')).toEqual(
      expect.objectContaining({
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: '30',
      }),
    );
    expect(planFeatures.get('plan-starter:custom_roles')).toEqual(
      expect.objectContaining({
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: true,
      }),
    );
    expect(planFeatures.get('plan-pro:max_classes')).toEqual(
      expect.objectContaining({
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: '50',
      }),
    );
  });

  it('lists public active plans with normalized features for workspace creation', async () => {
    await service.onModuleInit();

    const result = await service.listPublicPlans();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'free',
          features: expect.arrayContaining([
            expect.objectContaining({
              featureKey: 'max_students',
              value: 30,
            }),
          ]),
        }),
        expect.objectContaining({ code: 'starter' }),
        expect.objectContaining({ code: 'pro' }),
      ]),
    );
  });
});
