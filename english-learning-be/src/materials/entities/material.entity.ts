import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssignmentMaterial } from 'src/assignments/entities/assignment-material.entity';
import { LectureMaterial } from 'src/lectures/entities/lecture-material.entity';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { MaterialUploadSession } from './material-upload-session.entity';

export enum MaterialCategory {
  GENERAL = 'general',
  LECTURE = 'lecture',
  ASSIGNMENT = 'assignment',
  SUBMISSION = 'submission',
}

export enum MaterialStatus {
  PENDING = 'pending',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.READY,
  })
  status: MaterialStatus;

  @Column({ type: 'varchar', length: 255 })
  bucket: string;

  @Column({ type: 'text' })
  objectKey: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mimeType: string | null;

  @Column({ type: 'integer', nullable: true })
  size: number | null;

  @Column({
    type: 'enum',
    enum: MaterialCategory,
    default: MaterialCategory.GENERAL,
  })
  category: MaterialCategory;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User | null;

  @OneToMany(
    () => LectureMaterial,
    (lectureMaterial: LectureMaterial) => lectureMaterial.material,
  )
  lectureMaterials: LectureMaterial[];

  @OneToMany(
    () => AssignmentMaterial,
    (assignmentMaterial: AssignmentMaterial) => assignmentMaterial.material,
  )
  assignmentMaterials: AssignmentMaterial[];

  @OneToMany(
    () => SubmissionEntity,
    (submission: SubmissionEntity) => submission.material,
  )
  submissions: SubmissionEntity[];

  @OneToMany(
    () => MaterialUploadSession,
    (uploadSession: MaterialUploadSession) => uploadSession.material,
  )
  uploadSessions: MaterialUploadSession[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
