import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

export enum NotificationType {
  ASSIGNMENT_CREATED = 'assignment_created',
  ASSIGNMENT_MATERIALS_PUBLISHED = 'assignment_materials_published',
  ASSIGNMENT_DUE_REMINDER = 'assignment_due_reminder',
  ASSIGNMENT_MISSED = 'assignment_missed',
  ATTENDANCE_UPDATED = 'attendance_updated',
  CLASS_STUDENT_ADDED = 'class_student_added',
  LECTURE_CREATED = 'lecture_created',
  LECTURE_MATERIALS_PUBLISHED = 'lecture_materials_published',
  SESSION_CREATED = 'session_created',
  SESSION_UPDATED = 'session_updated',
  SESSION_CANCELLED = 'session_cancelled',
  SUBMISSION_CREATED = 'submission_created',
  SUBMISSION_REVIEWED = 'submission_reviewed',
}

@Index('idx_notifications_recipient_created_at', ['recipient', 'createdAt'])
@Index('idx_notifications_recipient_is_read', ['recipient', 'isRead'])
@Index('uq_notifications_dedupe_key', ['dedupeKey'], {
  unique: true,
  where: '"dedupeKey" IS NOT NULL',
})
@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientUserId' })
  recipient: User;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dedupeKey: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
