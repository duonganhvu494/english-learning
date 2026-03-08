/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/rbac/entities/role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { RolePermission } from "./role-permission.entity";
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';

@Entity("roles")
@Index('UQ_roles_system_name', ['name'], {
  unique: true,
  where: `"isSystem" = true AND "workspaceId" IS NULL AND "classId" IS NULL`,
})
@Index('UQ_roles_workspace_name', ['workspaceId', 'name'], {
  unique: true,
  where: `"isSystem" = false AND "workspaceId" IS NOT NULL AND "classId" IS NULL`,
})
@Index('UQ_roles_class_name', ['classId', 'name'], {
  unique: true,
  where: `"isSystem" = false AND "classId" IS NOT NULL AND "workspaceId" IS NULL`,
})
@Check(
  'CHK_roles_scope',
  `(
    ("isSystem" = true AND "workspaceId" IS NULL AND "classId" IS NULL)
    OR
    ("isSystem" = false AND "workspaceId" IS NOT NULL AND "classId" IS NULL)
    OR
    ("isSystem" = false AND "workspaceId" IS NULL AND "classId" IS NOT NULL)
  )`,
)
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string; // owner | admin | teacher | student

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ type: 'uuid', nullable: true })
  classId: string | null;

  @Column({ default: true })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rp: RolePermission) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => WorkspaceMember, (member: WorkspaceMember) => member.role)
  workspaceMembers: WorkspaceMember[];

  @OneToMany(() => ClassStudent, (classStudent: ClassStudent) => classStudent.role)
  classStudents: ClassStudent[];
}
