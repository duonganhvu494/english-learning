import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    register: jest.Mock;
    findAll: jest.Mock;
    getUserById: jest.Mock;
    updateProfile: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      register: jest.fn(),
      findAll: jest.fn(),
      getUserById: jest.fn(),
      updateProfile: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('registers a user and wraps the response', async () => {
    usersService.register.mockResolvedValue({ id: 'user-1' });

    const result = await controller.register({
      fullName: 'Teacher One',
      email: 'teacher@example.com',
      userName: 'teacher1',
      password: 'secret123',
    });

    expect(usersService.register).toHaveBeenCalledWith({
      fullName: 'Teacher One',
      email: 'teacher@example.com',
      userName: 'teacher1',
      password: 'secret123',
    });
    expect(result).toEqual({
      statusCode: 200,
      message: 'User created',
      result: { id: 'user-1' },
    });
  });

  it('returns the admin user list', async () => {
    usersService.findAll.mockResolvedValue([{ id: 'user-1' }]);

    const result = await controller.findAll();

    expect(usersService.findAll).toHaveBeenCalledWith();
    expect(result).toEqual({
      statusCode: 200,
      message: 'Users retrieved',
      result: [{ id: 'user-1' }],
    });
  });

  it('returns the current user profile', async () => {
    usersService.getUserById.mockResolvedValue({ id: 'user-1' });

    const result = await controller.getMe({
      user: { userId: 'user-1' },
    } as never);

    expect(usersService.getUserById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'User retrieved',
      result: { id: 'user-1' },
    });
  });

  it('returns a specific user through the admin route', async () => {
    usersService.getUserById.mockResolvedValue({ id: 'user-2' });

    const result = await controller.findOne('user-2');

    expect(usersService.getUserById).toHaveBeenCalledWith('user-2');
    expect(result).toEqual({
      statusCode: 200,
      message: 'User retrieved',
      result: { id: 'user-2' },
    });
  });

  it('updates the current user profile', async () => {
    usersService.updateProfile.mockResolvedValue({ id: 'user-1' });

    const result = await controller.updateMe(
      { fullName: 'Updated Name' },
      { user: { userId: 'user-1' } } as never,
    );

    expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', {
      fullName: 'Updated Name',
    });
    expect(result).toEqual({
      statusCode: 200,
      message: 'User updated',
      result: { id: 'user-1' },
    });
  });

  it('removes a user through the admin route', async () => {
    usersService.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove('user-1');

    expect(usersService.remove).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'User removed',
      result: { deleted: true },
    });
  });
});
