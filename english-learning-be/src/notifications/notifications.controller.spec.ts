import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const notificationsService = {
    listMyNotifications: jest.fn(),
    getMyUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('lists current user notifications in a success envelope', async () => {
    notificationsService.listMyNotifications.mockResolvedValue([
      { id: 'notification-1' },
    ]);

    const result = await controller.listMyNotifications(
      { user: { userId: 'user-1' } } as never,
      {},
    );

    expect(notificationsService.listMyNotifications).toHaveBeenCalledWith(
      'user-1',
      {},
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Notifications fetched',
      result: [{ id: 'notification-1' }],
    });
  });

  it('marks all notifications as read for the current user', async () => {
    notificationsService.markAllAsRead.mockResolvedValue({ updatedCount: 3 });

    const result = await controller.markAllAsRead({
      user: { userId: 'user-1' },
    } as never);

    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'All notifications marked as read',
      result: { updatedCount: 3 },
    });
  });
});
