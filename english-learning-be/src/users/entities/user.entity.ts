import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

export enum AccountType {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

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

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  accountType: AccountType;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({ default: true })
  isActive: boolean;
}
