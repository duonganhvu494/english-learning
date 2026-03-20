import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Material } from 'src/materials/entities/material.entity';
import { LectureEntity } from './lecture.entity';

@Entity('lecture_materials')
@Unique(['lecture', 'material'])
export class LectureMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => LectureEntity,
    (lecture: LectureEntity) => lecture.lectureMaterials,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'lectureId' })
  lecture: LectureEntity;

  @ManyToOne(
    () => Material,
    (material: Material) => material.lectureMaterials,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;
}
