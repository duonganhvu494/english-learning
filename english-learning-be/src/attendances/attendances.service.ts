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
import { AttendanceUpdateResponseDto } from './dto/attendance-update-response.dto';
import { SessionAttendanceResponseDto } from './dto/session-attendance-response.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceEntity, AttendanceStatus } from './entities/attendance.entity';

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
      throw new BadRequestException('Session not found');
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
      throw new BadRequestException('Session not found');
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
      throw new BadRequestException('Student is not assigned to session class');
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
      throw new BadRequestException('Session not found');
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
        'Only students assigned to the class can check in',
      );
    }

    if (classStudent.student.accountType !== AccountType.STUDENT) {
      throw new ForbiddenException('Only student accounts can check in');
    }

    const existingAttendance = await this.findAttendance(
      session.id,
      classStudent.student.id,
    );
    if (existingAttendance) {
      if (existingAttendance.status === AttendanceStatus.ABSENT) {
        throw new ForbiddenException(
          'Attendance was already marked absent and cannot be self-updated',
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

  private resolveSelfCheckInStatus(session: SessionEntity): AttendanceStatus {
    const now = Date.now();
    const sessionStart = session.timeStart.getTime();
    const sessionEnd = session.timeEnd.getTime();

    if (now > sessionEnd) {
      throw new BadRequestException('Session check-in has already closed');
    }

    if (now <= sessionStart) {
      return AttendanceStatus.PRESENT;
    }

    const lateWindowMinutes = this.getSelfCheckInLateMinutes();
    const lateWindowEndsAt = sessionStart + lateWindowMinutes * 60 * 1000;
    if (now <= lateWindowEndsAt) {
      return AttendanceStatus.LATE;
    }

    throw new BadRequestException('Late self check-in window has closed');
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
