import { AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceUpdateResponseDto {
  sessionId: string;
  studentId: string;
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
