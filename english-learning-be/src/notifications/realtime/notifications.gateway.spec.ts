import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';
import { UsersService } from 'src/users/users.service';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  const configService = {
    getOrThrow: jest.fn(() => 'jwt-secret'),
  };
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const usersService = {
    findById: jest.fn(),
  };
  const authSessionsService = {
    isAccessTokenDenied: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: AuthSessionsService,
          useValue: authSessionsService,
        },
      ],
    }).compile();

    gateway = module.get(NotificationsGateway);
  });

  it('authenticates a socket using the accessToken cookie and joins the user room', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      userId: 'user-1',
      jti: 'jti-1',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      isActive: true,
    });
    authSessionsService.isAccessTokenDenied.mockResolvedValue(false);

    const client = {
      handshake: {
        headers: {
          cookie: 'accessToken=token-1; refreshToken=refresh-1',
        },
      },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-1', {
      secret: 'jwt-secret',
    });
    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(client.emit).toHaveBeenCalledWith('notifications.connected', {
      userId: 'user-1',
    });

    gateway.handleDisconnect(client as never);
  });

  it('disconnects the socket when authentication fails', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const client = {
      handshake: {
        headers: {
          cookie: 'accessToken=bad-token',
        },
      },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
});
