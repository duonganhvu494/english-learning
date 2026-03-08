import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { ClassStudent } from './class-student.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';

@Entity('classes')
@Unique(['className', 'workspace'])
export class ClassEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  className: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.classEntity)
  classStudents: ClassStudent[];

  @OneToMany(() => SessionEntity, (session) => session.classEntity)
  sessions: SessionEntity[];
}
