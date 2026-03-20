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
import { AssignmentQuizAttemptAnswerEntity } from './assignment-quiz-attempt-answer.entity';
import { AssignmentQuizQuestionEntity } from './assignment-quiz-question.entity';

@Entity('assignment_quiz_options')
export class AssignmentQuizOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => AssignmentQuizQuestionEntity,
    (question: AssignmentQuizQuestionEntity) => question.options,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'questionId' })
  question: AssignmentQuizQuestionEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @OneToMany(
    () => AssignmentQuizAttemptAnswerEntity,
    (answer: AssignmentQuizAttemptAnswerEntity) => answer.selectedOption,
  )
  attemptAnswers: AssignmentQuizAttemptAnswerEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
