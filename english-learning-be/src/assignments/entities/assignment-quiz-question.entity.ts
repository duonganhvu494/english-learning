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
import { Material } from 'src/materials/entities/material.entity';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentQuizAttemptAnswerEntity } from './assignment-quiz-attempt-answer.entity';
import { AssignmentQuizOptionEntity } from './assignment-quiz-option.entity';

export enum AssignmentQuizQuestionType {
  SINGLE_CHOICE = 'single_choice',
}

@Entity('assignment_quiz_questions')
export class AssignmentQuizQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => AssignmentEntity,
    (assignment: AssignmentEntity) => assignment.quizQuestions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'assignmentId' })
  assignment: AssignmentEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: AssignmentQuizQuestionType,
    default: AssignmentQuizQuestionType.SINGLE_CHOICE,
  })
  type: AssignmentQuizQuestionType;

  @Column({ type: 'float', default: 1 })
  points: number;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Material, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'materialId' })
  material: Material | null;

  @OneToMany(
    () => AssignmentQuizOptionEntity,
    (option: AssignmentQuizOptionEntity) => option.question,
  )
  options: AssignmentQuizOptionEntity[];

  @OneToMany(
    () => AssignmentQuizAttemptAnswerEntity,
    (answer: AssignmentQuizAttemptAnswerEntity) => answer.question,
  )
  attemptAnswers: AssignmentQuizAttemptAnswerEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
