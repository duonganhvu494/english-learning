import { AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceSelfResponseDto {
  sessionId: string;
  studentId: string;
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
