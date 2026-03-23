import { AttendanceStatus } from '../entities/attendance.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceSelfResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  sessionId: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;
  @ApiProperty({
    enum: AttendanceStatus,
    nullable: true,
    example: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus | null;

  static fromData(input: {
    sessionId: string;
    studentId: string;
    status: AttendanceStatus | null;
  }): AttendanceSelfResponseDto {
    const dto = new AttendanceSelfResponseDto();
    dto.sessionId = input.sessionId;
    dto.studentId = input.studentId;
    dto.status = input.status;
    return dto;
  }
}
