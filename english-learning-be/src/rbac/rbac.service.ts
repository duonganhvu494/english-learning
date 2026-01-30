// src/rbac/rbac.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedSystemRoles();
  }

  private async seedSystemRoles() {
    const roles = ['owner', 'admin', 'teacher', 'student'];

    for (const name of roles) {
      const exist = await this.roleRepo.findOne({
        where: { name, isSystem: true },
      });
      if (!exist) {
        const role = this.roleRepo.create({
          name,
          isSystem: true,
          workspaceId: null,
        });
        await this.roleRepo.save(role);
      }
    }
  }
}
