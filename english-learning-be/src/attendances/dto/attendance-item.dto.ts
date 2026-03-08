import { User } from 'src/users/entities/user.entity';
import { AttendanceEntity, AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceItemDto {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  status: AttendanceStatus | null;

  static fromData(input: {
    student: User;
    attendance?: AttendanceEntity | null;
  }): AttendanceItemDto {
    const dto = new AttendanceItemDto();
    dto.studentId = input.student.id;
    dto.fullName = input.student.fullName;
    dto.userName = input.student.userName;
    dto.email = input.student.email;
    dto.status = input.attendance?.status ?? null;
    return dto;
  }
}
