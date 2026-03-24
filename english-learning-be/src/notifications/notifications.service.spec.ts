import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsGateway } from './realtime/notifications.gateway';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const notificationRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    create: jest.fn((input: Record<string, unknown>) => input),
    createQueryBuilder: jest.fn(),
  };
  const userRepo = {
    findOne: jest.fn(),
  };
  const notificationsGateway = {
    emitNotificationCreated: jest.fn(),
    emitNotificationRead: jest.fn(),
    emitNotificationsReadAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    notificationRepo.createQueryBuilder.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: notificationRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: NotificationsGateway,
          useValue: notificationsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('lists notifications for the current user', async () => {
    notificationRepo.find.mockResolvedValue([
      {
        id: 'notification-1',
        type: 'assignment_created',
        title: 'New assignment posted',
        body: 'Homework 01 has been posted.',
        data: { assignmentId: 'assignment-1' },
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-03-24T10:00:00.000Z'),
      },
    ]);

    const result = await service.listMyNotifications('user-1', {});

    expect(notificationRepo.find).toHaveBeenCalledWith({
      where: {
        recipient: { id: 'user-1' },
      },
      order: {
        createdAt: 'DESC',
      },
      take: 20,
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'notification-1',
        type: 'assignment_created',
        isRead: false,
      }),
    ]);
  });

  it('marks a notification as read for the owner', async () => {
    notificationRepo.findOne.mockResolvedValue({
      id: 'notification-1',
      type: 'assignment_created',
      title: 'New assignment posted',
      body: 'Homework 01 has been posted.',
      data: null,
      isRead: false,
      readAt: null,
      createdAt: new Date('2026-03-24T10:00:00.000Z'),
    });
    notificationRepo.save.mockResolvedValue(undefined);
    notificationRepo.count.mockResolvedValue(0);

    const result = await service.markAsRead('notification-1', 'user-1');

    expect(notificationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'notification-1',
        isRead: true,
      }),
    );
    expect(notificationsGateway.emitNotificationRead).toHaveBeenCalledWith(
      'user-1',
      'notification-1',
      expect.any(Number),
      expect.any(Date),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'notification-1',
        isRead: true,
      }),
    );
  });

  it('rejects marking a notification as read when it does not belong to the user', async () => {
    notificationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.markAsRead('notification-1', 'user-1'),
    ).rejects.toThrow(new BadRequestException('Notification not found'));
  });

  it('ignores deduplicated notifications when the dedupe key already exists', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'user-1' });
    notificationRepo.save.mockRejectedValue({ code: '23505' });

    await expect(
      service.createNotification({
        recipientUserId: 'user-1',
        type: 'assignment_created',
        title: 'New assignment posted',
        body: 'Homework 01 has been posted.',
        dedupeKey: 'assignment-created:assignment-1:user-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('publishes websocket events after a new notification is stored', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'user-1' });
    notificationRepo.save.mockResolvedValue(undefined);
    notificationRepo.count.mockResolvedValue(2);

    await service.createNotification({
      recipientUserId: 'user-1',
      type: 'assignment_created',
      title: 'New assignment posted',
      body: 'Homework 01 has been posted.',
    });

    expect(notificationsGateway.emitNotificationCreated).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: 'New assignment posted',
      }),
      2,
    );
  });
});
