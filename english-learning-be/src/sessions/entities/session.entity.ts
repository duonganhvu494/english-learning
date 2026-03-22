import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { AttendanceEntity } from 'src/attendances/entities/attendance.entity';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';

@Index('uq_sessions_class_code', ['classEntity', 'code'], { unique: true })
@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classId' })
  classEntity: ClassEntity;

  @Column({ type: 'timestamptz' })
  timeStart: Date;

  @Column({ type: 'timestamptz' })
  timeEnd: Date;

  @Column({ type: 'varchar', length: 255 })
  topic: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  code: string | null;

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.session)
  attendances: AttendanceEntity[];

  @OneToMany(() => LectureEntity, (lecture: LectureEntity) => lecture.session)
  lectures: LectureEntity[];

  @OneToMany(
    () => AssignmentEntity,
    (assignment: AssignmentEntity) => assignment.session,
  )
  assignments: AssignmentEntity[];
}
