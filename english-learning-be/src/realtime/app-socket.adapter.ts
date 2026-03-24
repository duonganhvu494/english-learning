import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import type { Server, ServerOptions } from 'socket.io';

export class AppSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const allowedOrigins = this.configService.get<string[]>(
      'app.cors.allowedOrigins',
      [],
    );

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error(`Origin ${origin} is not allowed by WebSocket CORS`));
        },
        credentials: true,
      },
    }) as Server;

    return server;
  }
}
