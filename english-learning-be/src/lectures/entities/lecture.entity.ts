import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LectureMaterial } from './lecture-material.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { User } from 'src/users/entities/user.entity';

@Index('uq_lectures_session_code', ['session', 'code'], { unique: true })
@Entity('lectures')
export class LectureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => SessionEntity,
    (session: SessionEntity) => session.lectures,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'sessionId' })
  session: SessionEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  code: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: User | null;

  @OneToMany(
    () => LectureMaterial,
    (lectureMaterial: LectureMaterial) => lectureMaterial.lecture,
  )
  lectureMaterials: LectureMaterial[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
