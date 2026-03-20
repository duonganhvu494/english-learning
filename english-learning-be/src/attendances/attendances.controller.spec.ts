import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/rbac/rbac.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';

describe('AttendancesController', () => {
  let controller: AttendancesController;
  let attendancesService: {
    getSessionAttendances: jest.Mock;
    getMyAttendance: jest.Mock;
    updateAttendance: jest.Mock;
    selfCheckIn: jest.Mock;
  };

  beforeEach(async () => {
    attendancesService = {
      getSessionAttendances: jest.fn(),
      getMyAttendance: jest.fn(),
      updateAttendance: jest.fn(),
      selfCheckIn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancesController],
      providers: [
        {
          provide: AttendancesService,
          useValue: attendancesService,
        },
        {
          provide: RbacPermissionGuard,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {},
        },
        {
          provide: RbacService,
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AttendancesController>(AttendancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns session attendances through the success envelope', async () => {
    attendancesService.getSessionAttendances.mockResolvedValue([
      { studentId: 'student-1', status: 'present' },
    ]);

    const result = await controller.getSessionAttendances('session-1');

    expect(attendancesService.getSessionAttendances).toHaveBeenCalledWith(
      'session-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Session attendances fetched',
      result: [{ studentId: 'student-1', status: 'present' }],
    });
  });

  it('returns my attendance for the current user', async () => {
    attendancesService.getMyAttendance.mockResolvedValue({
      sessionId: 'session-1',
      status: 'present',
    });

    const result = await controller.getMyAttendance(
      'session-1',
      { user: { userId: 'student-1' } } as never,
    );

    expect(attendancesService.getMyAttendance).toHaveBeenCalledWith(
      'session-1',
      'student-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'My attendance fetched',
      result: {
        sessionId: 'session-1',
        status: 'present',
      },
    });
  });

  it('updates a student attendance', async () => {
    attendancesService.updateAttendance.mockResolvedValue({
      studentId: 'student-1',
      status: 'absent',
    });

    const result = await controller.updateAttendance(
      'session-1',
      'student-1',
      { status: 'absent' },
    );

    expect(attendancesService.updateAttendance).toHaveBeenCalledWith(
      'session-1',
      'student-1',
      { status: 'absent' },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Attendance updated',
      result: {
        studentId: 'student-1',
        status: 'absent',
      },
    });
  });

  it('checks in the current user', async () => {
    attendancesService.selfCheckIn.mockResolvedValue({
      sessionId: 'session-1',
      status: 'present',
    });

    const result = await controller.selfCheckIn(
      'session-1',
      { user: { userId: 'student-1' } } as never,
    );

    expect(attendancesService.selfCheckIn).toHaveBeenCalledWith(
      'session-1',
      'student-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Attendance checked in',
      result: {
        sessionId: 'session-1',
        status: 'present',
      },
    });
  });
});
