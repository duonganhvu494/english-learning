import { User } from 'src/users/entities/user.entity';
import { AttendanceEntity, AttendanceStatus } from '../entities/attendance.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;
  @ApiProperty({ example: 'Nguyen Van A' })
  fullName: string;
  @ApiProperty({ example: 'student01' })
  userName: string;
  @ApiProperty({ example: 'student01@example.com' })
  email: string;
  @ApiProperty({
    enum: AttendanceStatus,
    nullable: true,
    example: AttendanceStatus.PRESENT,
  })
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
