import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { AccountType } from 'src/users/entities/user.entity';
import { AttendancesService } from './attendances.service';
import { AttendanceEntity, AttendanceStatus } from './entities/attendance.entity';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let attendanceRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let sessionRepo: {
    findOne: jest.Mock;
  };
  let classStudentRepo: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    attendanceRepo = {
      findOne: jest.fn(),
      create: jest.fn((input: Partial<AttendanceEntity>) => input),
      save: jest.fn(
        (input: AttendanceEntity): Promise<AttendanceEntity> =>
          Promise.resolve(input),
      ),
    };
    sessionRepo = {
      findOne: jest.fn(),
    };
    classStudentRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: attendanceRepo,
        },
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'ATTENDANCE_SELF_CHECKIN_LATE_MINUTES' ? '15' : undefined,
            ),
          },
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('marks self check-in as present before session start', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-08T08:55:00.000Z'));

    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      timeStart: new Date('2026-03-08T09:00:00.000Z'),
      timeEnd: new Date('2026-03-08T10:00:00.000Z'),
      classEntity: { id: 'class-1' },
    });
    classStudentRepo.findOne.mockResolvedValue({
      student: {
        id: 'student-1',
        accountType: AccountType.STUDENT,
      },
    });
    attendanceRepo.findOne.mockResolvedValueOnce(null);

    const result = await service.selfCheckIn('session-1', 'student-1');

    expect(result.status).toBe(AttendanceStatus.PRESENT);
    expect(attendanceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AttendanceStatus.PRESENT,
      }),
    );

    jest.useRealTimers();
  });

  it('marks self check-in as late within late window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-08T09:10:00.000Z'));

    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      timeStart: new Date('2026-03-08T09:00:00.000Z'),
      timeEnd: new Date('2026-03-08T10:00:00.000Z'),
      classEntity: { id: 'class-1' },
    });
    classStudentRepo.findOne.mockResolvedValue({
      student: {
        id: 'student-1',
        accountType: AccountType.STUDENT,
      },
    });
    attendanceRepo.findOne.mockResolvedValueOnce(null);

    const result = await service.selfCheckIn('session-1', 'student-1');

    expect(result.status).toBe(AttendanceStatus.LATE);
    expect(attendanceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AttendanceStatus.LATE,
      }),
    );

    jest.useRealTimers();
  });

  it('rejects self check-in after late window closes', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-08T09:20:00.000Z'));

    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      timeStart: new Date('2026-03-08T09:00:00.000Z'),
      timeEnd: new Date('2026-03-08T10:00:00.000Z'),
      classEntity: { id: 'class-1' },
    });
    classStudentRepo.findOne.mockResolvedValue({
      student: {
        id: 'student-1',
        accountType: AccountType.STUDENT,
      },
    });
    attendanceRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.selfCheckIn('session-1', 'student-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(attendanceRepo.save).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('does not let student override an absent attendance', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-08T09:05:00.000Z'));

    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      timeStart: new Date('2026-03-08T09:00:00.000Z'),
      timeEnd: new Date('2026-03-08T10:00:00.000Z'),
      classEntity: { id: 'class-1' },
    });
    classStudentRepo.findOne.mockResolvedValue({
      student: {
        id: 'student-1',
        accountType: AccountType.STUDENT,
      },
    });
    attendanceRepo.findOne.mockResolvedValueOnce({
      status: AttendanceStatus.ABSENT,
    });

    await expect(service.selfCheckIn('session-1', 'student-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(attendanceRepo.save).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('returns my attendance status and allows null when not checked in yet', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: { id: 'class-1' },
    });
    classStudentRepo.findOne.mockResolvedValue({
      student: {
        id: 'student-1',
        accountType: AccountType.STUDENT,
      },
    });
    attendanceRepo.findOne.mockResolvedValue(null);

    const result = await service.getMyAttendance('session-1', 'student-1');

    expect(result).toEqual({
      sessionId: 'session-1',
      studentId: 'student-1',
      status: null,
    });
  });
});
