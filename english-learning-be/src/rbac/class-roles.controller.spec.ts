import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { RbacService } from './rbac.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { ClassRolesController } from './class-roles.controller';

describe('ClassRolesController', () => {
  let controller: ClassRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassRolesController],
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
          provide: Reflector,
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClassRolesController>(ClassRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
