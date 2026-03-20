import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentQuizAttemptAnswerEntity } from './assignment-quiz-attempt-answer.entity';

export enum AssignmentQuizAttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}

@Entity('assignment_quiz_attempts')
@Unique(['assignment', 'student'])
export class AssignmentQuizAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => AssignmentEntity,
    (assignment: AssignmentEntity) => assignment.quizAttempts,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'assignmentId' })
  assignment: AssignmentEntity;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({
    type: 'enum',
    enum: AssignmentQuizAttemptStatus,
    default: AssignmentQuizAttemptStatus.IN_PROGRESS,
  })
  status: AssignmentQuizAttemptStatus;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'float', nullable: true })
  score: number | null;

  @Column({ type: 'float', default: 0 })
  maxScore: number;

  @Column({ type: 'integer', default: 0 })
  correctCount: number;

  @Column({ type: 'integer', default: 0 })
  totalQuestions: number;

  @OneToMany(
    () => AssignmentQuizAttemptAnswerEntity,
    (answer: AssignmentQuizAttemptAnswerEntity) => answer.attempt,
  )
  answers: AssignmentQuizAttemptAnswerEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
