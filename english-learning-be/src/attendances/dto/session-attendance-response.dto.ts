import { AttendanceItemDto } from './attendance-item.dto';

export class SessionAttendanceResponseDto {
  sessionId: string;
  classId: string;
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
