import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentCreatedEvent } from 'src/assignments/events/assignment-created.event';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { NotificationType } from '../entities/notification.entity';
import { AssignmentNotificationsListener } from './assignment-notifications.listener';
import { NotificationsService } from '../notifications.service';

describe('AssignmentNotificationsListener', () => {
  let listener: AssignmentNotificationsListener;
  const assignmentRepo = {
    findOne: jest.fn(),
  };
  const classStudentRepo = {
    find: jest.fn(),
  };
  const notificationsService = {
    createManyNotifications: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentNotificationsListener,
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    listener = module.get<AssignmentNotificationsListener>(
      AssignmentNotificationsListener,
    );
  });

  it('creates one notification per student when an assignment is created', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
      title: 'Homework 01',
      session: {
        id: 'session-1',
        topic: 'Session 1',
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
    });
    classStudentRepo.find.mockResolvedValue([
      { student: { id: 'student-1' } },
      { student: { id: 'student-2' } },
    ]);
    notificationsService.createManyNotifications.mockResolvedValue(undefined);

    await listener.handleAssignmentCreated(
      new AssignmentCreatedEvent('assignment-1', 'session-1', 'teacher-1'),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.ASSIGNMENT_CREATED,
        dedupeKey: 'assignment-created:assignment-1:student-1',
      }),
      expect.objectContaining({
        recipientUserId: 'student-2',
        type: NotificationType.ASSIGNMENT_CREATED,
        dedupeKey: 'assignment-created:assignment-1:student-2',
      }),
    ]);
  });
});
