import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { AccountType } from 'src/users/entities/user.entity';
import { AttendanceItemDto } from './dto/attendance-item.dto';
import { AttendanceSelfResponseDto } from './dto/attendance-self-response.dto';
import { AttendanceUpdateResponseDto } from './dto/attendance-update-response.dto';
import { SessionAttendanceResponseDto } from './dto/session-attendance-response.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceEntity, AttendanceStatus } from './entities/attendance.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,

    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly config: ConfigService,
  ) {}

  async getSessionAttendances(
    sessionId: string,
  ): Promise<SessionAttendanceResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: true,
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload('Session not found', 'ATTENDANCE_SESSION_NOT_FOUND'),
      );
    }

    const classStudents = await this.classStudentRepo.find({
      where: {
        classEntity: { id: session.classEntity.id },
      },
      relations: {
        student: true,
      },
      order: {
        student: {
          fullName: 'ASC',
        },
      },
    });

    const attendances = await this.attendanceRepo.find({
      where: {
        session: { id: sessionId },
      },
      relations: {
        student: true,
      },
    });

    const attendanceMap = new Map(
      attendances.map((attendance) => [attendance.student.id, attendance]),
    );

    return SessionAttendanceResponseDto.fromData({
      sessionId,
      classId: session.classEntity.id,
      attendances: classStudents.map((classStudent) =>
        AttendanceItemDto.fromData({
          student: classStudent.student,
          attendance: attendanceMap.get(classStudent.student.id) ?? null,
        }),
      ),
    });
  }

  async updateAttendance(
    sessionId: string,
    studentId: string,
    dto: UpdateAttendanceDto,
  ): Promise<AttendanceUpdateResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: true,
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload('Session not found', 'ATTENDANCE_SESSION_NOT_FOUND'),
      );
    }

    const classStudent = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: session.classEntity.id },
        student: { id: studentId },
      },
      relations: {
        student: true,
      },
    });
    if (!classStudent) {
      throw new BadRequestException(
        errorPayload(
          'Student is not assigned to session class',
          'ATTENDANCE_STUDENT_NOT_ASSIGNED_TO_SESSION_CLASS',
        ),
      );
    }

    const savedAttendance = await this.upsertAttendance(
      session,
      classStudent.student,
      dto.status,
    );

    return AttendanceUpdateResponseDto.fromData({
      sessionId,
      studentId,
      status: savedAttendance.status,
    });
  }

  async selfCheckIn(
    sessionId: string,
    actorUserId: string,
  ): Promise<AttendanceUpdateResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload('Session not found', 'ATTENDANCE_SESSION_NOT_FOUND'),
      );
    }

    const classStudent = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: session.classEntity.id },
        student: { id: actorUserId },
      },
      relations: {
        student: true,
      },
    });
    if (!classStudent) {
      throw new ForbiddenException(
        errorPayload(
          'Only students assigned to the class can check in',
          'ATTENDANCE_SELF_CHECKIN_CLASS_STUDENT_REQUIRED',
        ),
      );
    }

    if (classStudent.student.accountType !== AccountType.STUDENT) {
      throw new ForbiddenException(
        errorPayload(
          'Only student accounts can check in',
          'ATTENDANCE_SELF_CHECKIN_STUDENT_ACCOUNT_REQUIRED',
        ),
      );
    }

    const existingAttendance = await this.findAttendance(
      session.id,
      classStudent.student.id,
    );
    if (existingAttendance) {
      if (existingAttendance.status === AttendanceStatus.ABSENT) {
        throw new ForbiddenException(
          errorPayload(
            'Attendance was already marked absent and cannot be self-updated',
            'ATTENDANCE_SELF_CHECKIN_ABSENT_LOCKED',
          ),
        );
      }

      return AttendanceUpdateResponseDto.fromData({
        sessionId,
        studentId: classStudent.student.id,
        status: existingAttendance.status,
      });
    }

    const status = this.resolveSelfCheckInStatus(session);
    const savedAttendance = await this.upsertAttendance(
      session,
      classStudent.student,
      status,
    );

    return AttendanceUpdateResponseDto.fromData({
      sessionId,
      studentId: classStudent.student.id,
      status: savedAttendance.status,
    });
  }

  async getMyAttendance(
    sessionId: string,
    actorUserId: string,
  ): Promise<AttendanceSelfResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: true,
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload('Session not found', 'ATTENDANCE_SESSION_NOT_FOUND'),
      );
    }

    const classStudent = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: session.classEntity.id },
        student: { id: actorUserId },
      },
      relations: {
        student: true,
      },
    });
    if (!classStudent) {
      throw new ForbiddenException(
        errorPayload(
          'Only students assigned to the class can view attendance',
          'ATTENDANCE_VIEW_CLASS_STUDENT_REQUIRED',
        ),
      );
    }

    if (classStudent.student.accountType !== AccountType.STUDENT) {
      throw new ForbiddenException(
        errorPayload(
          'Only student accounts can view attendance',
          'ATTENDANCE_VIEW_STUDENT_ACCOUNT_REQUIRED',
        ),
      );
    }

    const attendance = await this.findAttendance(sessionId, actorUserId);

    return AttendanceSelfResponseDto.fromData({
      sessionId,
      studentId: actorUserId,
      status: attendance?.status ?? null,
    });
  }

  private resolveSelfCheckInStatus(session: SessionEntity): AttendanceStatus {
    const now = Date.now();
    const sessionStart = session.timeStart.getTime();
    const sessionEnd = session.timeEnd.getTime();

    if (now > sessionEnd) {
      throw new BadRequestException(
        errorPayload(
          'Session check-in has already closed',
          'ATTENDANCE_CHECKIN_CLOSED',
        ),
      );
    }

    if (now <= sessionStart) {
      return AttendanceStatus.PRESENT;
    }

    const lateWindowMinutes = this.getSelfCheckInLateMinutes();
    const lateWindowEndsAt = sessionStart + lateWindowMinutes * 60 * 1000;
    if (now <= lateWindowEndsAt) {
      return AttendanceStatus.LATE;
    }

    throw new BadRequestException(
      errorPayload(
        'Late self check-in window has closed',
        'ATTENDANCE_LATE_CHECKIN_WINDOW_CLOSED',
      ),
    );
  }

  private getSelfCheckInLateMinutes(): number {
    const rawValue = this.config.get<string>(
      'ATTENDANCE_SELF_CHECKIN_LATE_MINUTES',
    );
    const parsedValue = Number.parseInt(rawValue ?? '15', 10);
    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      return 15;
    }

    return parsedValue;
  }

  private findAttendance(
    sessionId: string,
    studentId: string,
  ): Promise<AttendanceEntity | null> {
    return this.attendanceRepo.findOne({
      where: {
        session: { id: sessionId },
        student: { id: studentId },
      },
      relations: {
        session: true,
        student: true,
      },
    });
  }

  private async upsertAttendance(
    session: SessionEntity,
    student: ClassStudent['student'],
    status: AttendanceStatus,
  ): Promise<AttendanceEntity> {
    let attendance = await this.findAttendance(session.id, student.id);

    if (!attendance) {
      attendance = this.attendanceRepo.create({
        session,
        student,
        status,
      });
    } else {
      attendance.status = status;
    }

    return this.attendanceRepo.save(attendance);
  }
}
