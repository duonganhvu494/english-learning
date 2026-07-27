import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEnum(AttendanceStatus, {
    message: 'status must be one of: PRESENT, ABSENT, LATE',
  })
  status: AttendanceStatus;
}
