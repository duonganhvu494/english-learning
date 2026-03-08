import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Role } from 'src/rbac/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { ClassEntity } from './class.entity';

@Entity('class_students')
@Unique(['classEntity', 'student'])
export class ClassStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.classStudents)
  @JoinColumn({ name: 'classId' })
  classEntity: ClassEntity;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => Role, (role) => role.classStudents, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role | null;
}
