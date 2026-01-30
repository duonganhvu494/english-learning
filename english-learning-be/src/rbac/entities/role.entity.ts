/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/rbac/entities/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RolePermission } from "./role-permission.entity";
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string; // owner | admin | teacher | student

  @Column({ type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ default: true })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rp: RolePermission) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => WorkspaceMember, (member: WorkspaceMember) => member.role)
  workspaceMembers: WorkspaceMember[];
}
