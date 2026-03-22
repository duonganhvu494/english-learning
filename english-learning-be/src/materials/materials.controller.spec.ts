import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/rbac/rbac.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

describe('MaterialsController', () => {
  let controller: MaterialsController;
  let materialsService: {
    initMaterialUpload: jest.Mock;
    signMaterialUploadPart: jest.Mock;
    completeMaterialUpload: jest.Mock;
    abortMaterialUpload: jest.Mock;
    listWorkspaceMaterials: jest.Mock;
    getMaterialDownloadTarget: jest.Mock;
    deleteMaterial: jest.Mock;
  };

  beforeEach(async () => {
    materialsService = {
      initMaterialUpload: jest.fn(),
      signMaterialUploadPart: jest.fn(),
      completeMaterialUpload: jest.fn(),
      abortMaterialUpload: jest.fn(),
      listWorkspaceMaterials: jest.fn(),
      getMaterialDownloadTarget: jest.fn(),
      deleteMaterial: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialsController],
      providers: [
        {
          provide: MaterialsService,
          useValue: materialsService,
        },
        {
          provide: RbacPermissionGuard,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {},
        },
        {
          provide: RbacService,
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<MaterialsController>(MaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('initializes material upload for the current owner and wraps the response', async () => {
    materialsService.initMaterialUpload.mockResolvedValue({
      materialId: 'material-1',
      uploadId: 'upload-1',
    });

    const result = await controller.initMaterialUpload(
      'workspace-1',
      {
        fileName: 'lesson-1.mp4',
        mimeType: 'video/mp4',
        size: 1024,
      },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(materialsService.initMaterialUpload).toHaveBeenCalledWith(
      'workspace-1',
      {
        fileName: 'lesson-1.mp4',
        mimeType: 'video/mp4',
        size: 1024,
      },
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Material upload initialized',
      result: {
        materialId: 'material-1',
        uploadId: 'upload-1',
      },
    });
  });

  it('redirects material download to the signed url', async () => {
    const res = { redirect: jest.fn() };
    materialsService.getMaterialDownloadTarget.mockResolvedValue({
      type: 'remote',
      url: 'https://signed-download-url',
    });

    await controller.downloadMaterial('material-1', res as never);

    expect(materialsService.getMaterialDownloadTarget).toHaveBeenCalledWith(
      'material-1',
    );
    expect(res.redirect).toHaveBeenCalledWith('https://signed-download-url');
  });

  it('deletes a material and returns a success envelope', async () => {
    materialsService.deleteMaterial.mockResolvedValue({
      materialId: 'material-1',
    });

    const result = await controller.deleteMaterial('material-1');

    expect(materialsService.deleteMaterial).toHaveBeenCalledWith('material-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Material deleted',
      result: {
        materialId: 'material-1',
      },
    });
  });
});
