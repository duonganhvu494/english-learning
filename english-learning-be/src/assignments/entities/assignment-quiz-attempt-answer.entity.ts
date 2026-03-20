import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AssignmentQuizAttemptEntity } from './assignment-quiz-attempt.entity';
import { AssignmentQuizOptionEntity } from './assignment-quiz-option.entity';
import { AssignmentQuizQuestionEntity } from './assignment-quiz-question.entity';

@Entity('assignment_quiz_attempt_answers')
@Unique(['attempt', 'question'])
export class AssignmentQuizAttemptAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => AssignmentQuizAttemptEntity,
    (attempt: AssignmentQuizAttemptEntity) => attempt.answers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'attemptId' })
  attempt: AssignmentQuizAttemptEntity;

  @ManyToOne(
    () => AssignmentQuizQuestionEntity,
    (question: AssignmentQuizQuestionEntity) => question.attemptAnswers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'questionId' })
  question: AssignmentQuizQuestionEntity;

  @ManyToOne(
    () => AssignmentQuizOptionEntity,
    (option: AssignmentQuizOptionEntity) => option.attemptAnswers,
    { onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'selectedOptionId' })
  selectedOption: AssignmentQuizOptionEntity;

  @Column({ type: 'boolean' })
  isCorrect: boolean;

  @Column({ type: 'float', default: 0 })
  awardedPoints: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
