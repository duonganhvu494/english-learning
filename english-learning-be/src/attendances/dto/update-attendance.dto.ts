import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status to set for the student',
  })
  @IsEnum(AttendanceStatus, {
    message: 'status must be one of: present, absent, late',
  })
  status: AttendanceStatus;
}
