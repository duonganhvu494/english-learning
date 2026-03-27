import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacController } from './rbac.controller';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { WorkspacePlanGuard } from './guards/workspace-plan.guard';
import { RbacService } from './rbac.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceEntitlementService } from 'src/workspaces/workspace-entitlement.service';

describe('RbacController', () => {
  let controller: RbacController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RbacController],
      providers: [
        {
          provide: RbacService,
          useValue: {},
        },
        {
          provide: RbacPermissionGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: WorkspacePlanGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: WorkspaceEntitlementService,
          useValue: { assertWorkspaceHasUsablePlan: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<RbacController>(RbacController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
