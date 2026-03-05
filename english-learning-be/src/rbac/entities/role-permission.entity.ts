/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/rbac/entities/role-permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

@Entity("role_permissions")
@Unique(['role', 'permission'])
export class RolePermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Role, (role: Role) => role.rolePermissions)
  @JoinColumn({ name: "roleId" })
  role: Role;

  @ManyToOne(
    () => Permission,
    (permission: Permission) => permission.rolePermissions,
  )
  @JoinColumn({ name: "permissionId" })
  permission: Permission;
}
