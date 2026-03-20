import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { Material } from 'src/materials/entities/material.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('submissions')
@Unique(['assignment', 'student'])
export class SubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => AssignmentEntity,
    (assignment: AssignmentEntity) => assignment.submissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'assignmentId' })
  assignment: AssignmentEntity;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => Material, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ type: 'float', nullable: true })
  grade: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
