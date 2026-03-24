import { AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceUpdatedEvent {
  static readonly eventName = 'attendance.updated';

  constructor(
    public readonly sessionId: string,
    public readonly studentId: string,
    public readonly status: AttendanceStatus,
    public readonly updatedAt: string,
  ) {}
}
