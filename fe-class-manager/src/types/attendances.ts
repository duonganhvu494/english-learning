export type AttendanceStatusInput = 'PRESENT' | 'ABSENT' | 'LATE';
export type AttendanceStatusValue = 'present' | 'absent' | 'late';

export interface AttendanceItem {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  status: AttendanceStatusValue | null;
}

export interface SessionAttendanceResponse {
  sessionId: string;
  classId: string;
  attendances: AttendanceItem[];
}

export interface AttendanceUpdateDto {
  status: AttendanceStatusInput;
}

export interface AttendanceUpdateResponse {
  sessionId: string;
  studentId: string;
  status: AttendanceStatusValue;
}

export interface AttendanceSelfResponse {
  sessionId: string;
  studentId: string;
  status: AttendanceStatusValue | null;
}
