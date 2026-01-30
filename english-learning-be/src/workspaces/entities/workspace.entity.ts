// src/workspaces/entities/workspace.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { WorkspaceMember } from './workspace-member.entity';

@Entity('workspaces')
@Unique(['name', 'owner'])
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // owner để hiển thị / audit
  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => WorkspaceMember, (m: WorkspaceMember) => m.workspace)
  members: WorkspaceMember[];
}
