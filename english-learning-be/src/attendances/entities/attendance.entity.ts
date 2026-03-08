import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { User } from 'src/users/entities/user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

@Entity('attendances')
@Unique(['session', 'student'])
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => SessionEntity,
    (session: SessionEntity) => session.attendances,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'sessionId' })
  session: SessionEntity;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  status: AttendanceStatus;
}
