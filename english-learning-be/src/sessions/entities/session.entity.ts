import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { AttendanceEntity } from 'src/attendances/entities/attendance.entity';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.sessions)
  @JoinColumn({ name: 'classId' })
  classEntity: ClassEntity;

  @Column({ type: 'timestamptz' })
  timeStart: Date;

  @Column({ type: 'timestamptz' })
  timeEnd: Date;

  @Column({ type: 'varchar', length: 255 })
  topic: string;

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.session)
  attendances: AttendanceEntity[];
}
