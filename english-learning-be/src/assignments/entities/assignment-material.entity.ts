import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Material } from 'src/materials/entities/material.entity';
import { AssignmentEntity } from './assignment.entity';

@Entity('assignment_materials')
@Unique(['assignment', 'material'])
export class AssignmentMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => AssignmentEntity,
    (assignment: AssignmentEntity) => assignment.assignmentMaterials,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'assignmentId' })
  assignment: AssignmentEntity;

  @ManyToOne(
    () => Material,
    (material: Material) => material.assignmentMaterials,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;
}
