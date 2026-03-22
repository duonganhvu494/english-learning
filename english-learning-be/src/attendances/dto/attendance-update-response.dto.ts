import { AttendanceStatus } from '../entities/attendance.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceUpdateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  sessionId: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;
  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.LATE })
  status: AttendanceStatus;

  static fromData(input: {
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
  }): AttendanceUpdateResponseDto {
    const dto = new AttendanceUpdateResponseDto();
    dto.sessionId = input.sessionId;
    dto.studentId = input.studentId;
    dto.status = input.status;
    return dto;
  }
}
