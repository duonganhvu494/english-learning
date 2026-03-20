import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { Material } from './material.entity';

export enum MaterialUploadSessionStatus {
  INITIATED = 'initiated',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
  FAILED = 'failed',
}

@Entity('material_upload_sessions')
export class MaterialUploadSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Material, (material: Material) => material.uploadSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => AssignmentEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment: AssignmentEntity | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User | null;

  @Column({ type: 'varchar', length: 255 })
  uploadId: string;

  @Column({ type: 'varchar', length: 255 })
  bucket: string;

  @Column({ type: 'text' })
  objectKey: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mimeType: string | null;

  @Column({ type: 'bigint' })
  size: string;

  @Column({ type: 'integer' })
  partSize: number;

  @Column({ type: 'integer' })
  totalParts: number;

  @Column({
    type: 'enum',
    enum: MaterialUploadSessionStatus,
    default: MaterialUploadSessionStatus.INITIATED,
  })
  status: MaterialUploadSessionStatus;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
