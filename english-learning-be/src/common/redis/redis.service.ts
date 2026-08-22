import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.get<string>('redis.host', '127.0.0.1'),
      port: this.config.get<number>('redis.port', 6379),
      password: this.config.get<string | undefined>('redis.password'),
      db: this.config.get<number>('redis.db', 0),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  async withClient<T>(operation: (client: Redis) => Promise<T>): Promise<T> {
    await this.ensureConnected();
    return operation(this.client);
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }
}
