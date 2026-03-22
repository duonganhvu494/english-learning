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
import { AssignmentMaterial } from './assignment-material.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { AssignmentQuizAttemptEntity } from './assignment-quiz-attempt.entity';
import { AssignmentQuizQuestionEntity } from './assignment-quiz-question.entity';

export enum AssignmentType {
  MANUAL = 'manual',
  QUIZ = 'quiz',
}

@Index('uq_assignments_session_code', ['session', 'code'], { unique: true })
@Entity('assignments')
export class AssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => SessionEntity,
    (session: SessionEntity) => session.assignments,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'sessionId' })
  session: SessionEntity;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.MANUAL,
  })
  type: AssignmentType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  code: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz' })
  timeStart: Date;

  @Column({ type: 'timestamptz' })
  timeEnd: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: User | null;

  @OneToMany(
    () => AssignmentMaterial,
    (assignmentMaterial: AssignmentMaterial) => assignmentMaterial.assignment,
  )
  assignmentMaterials: AssignmentMaterial[];

  @OneToMany(
    () => SubmissionEntity,
    (submission: SubmissionEntity) => submission.assignment,
  )
  submissions: SubmissionEntity[];

  @OneToMany(
    () => AssignmentQuizQuestionEntity,
    (question: AssignmentQuizQuestionEntity) => question.assignment,
  )
  quizQuestions: AssignmentQuizQuestionEntity[];

  @OneToMany(
    () => AssignmentQuizAttemptEntity,
    (attempt: AssignmentQuizAttemptEntity) => attempt.assignment,
  )
  quizAttempts: AssignmentQuizAttemptEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
