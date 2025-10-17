import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  userName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({type: 'enum', enum: ['admin', 'teacher', 'student'], default: 'student'})
  globalRole: 'admin' | 'teacher' | 'student';

  @Column({ default: true })
  isActive: boolean;
}
