import { AttendanceItemDto } from './attendance-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SessionAttendanceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  sessionId: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440021' })
  classId: string;
  @ApiProperty({ type: [AttendanceItemDto] })
  attendances: AttendanceItemDto[];

  static fromData(input: {
    sessionId: string;
    classId: string;
    attendances: AttendanceItemDto[];
  }): SessionAttendanceResponseDto {
    const dto = new SessionAttendanceResponseDto();
    dto.sessionId = input.sessionId;
    dto.classId = input.classId;
    dto.attendances = [...input.attendances].sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
    return dto;
  }
}
