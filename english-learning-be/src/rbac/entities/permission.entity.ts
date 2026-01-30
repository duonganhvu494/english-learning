// src/rbac/entities/permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // create, read, update, delete

  @Column()
  resource: string; // class, assignment, material

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (rp:RolePermission) => rp.permission)
  rolePermissions: RolePermission[];
}
