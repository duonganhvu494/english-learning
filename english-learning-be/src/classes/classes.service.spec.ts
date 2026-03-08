import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from 'src/rbac/entities/role.entity';
import { RbacService } from 'src/rbac/rbac.service';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';
import { ClassesService } from './classes.service';
import { ClassEntity } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';

describe('ClassesService', () => {
  let service: ClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {},
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
        {
          provide: RbacService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
