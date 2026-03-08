import { IsEnum } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @IsEnum(AttendanceStatus, {
    message: 'status must be one of: present, absent, late',
  })
  status: AttendanceStatus;
}
