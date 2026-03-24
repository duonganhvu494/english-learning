import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { AssignmentMaterialsPublishedEvent } from 'src/assignments/events/assignment-materials-published.event';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { AssignmentMaterialsNotificationsListener } from './assignment-materials-notifications.listener';

describe('AssignmentMaterialsNotificationsListener', () => {
  let listener: AssignmentMaterialsNotificationsListener;
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
        AssignmentMaterialsNotificationsListener,
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

    listener = module.get(AssignmentMaterialsNotificationsListener);
  });

  it('creates assignment material notifications for class students', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
      title: 'Homework 01',
      session: {
        id: 'session-1',
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
    });
    classStudentRepo.find.mockResolvedValue([{ student: { id: 'student-1' } }]);

    await listener.handleAssignmentMaterialsPublished(
      new AssignmentMaterialsPublishedEvent(
        'assignment-1',
        'session-1',
        'teacher-1',
        ['material-1'],
        '2026-03-24T07:00:00.000Z',
      ),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.ASSIGNMENT_MATERIALS_PUBLISHED,
      }),
    ]);
  });
});
