import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @ApiProperty({
    enum: ['PRESENT', 'ABSENT', 'LATE'],
    example: 'PRESENT',
    description: 'Attendance status to set for the student',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEnum(AttendanceStatus, {
    message: 'status must be one of: PRESENT, ABSENT, LATE',
  })
  status: AttendanceStatus;
}
