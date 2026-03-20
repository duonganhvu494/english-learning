import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AuthSecurityService } from './auth/auth-security.service';
import { AllExceptionsFilter } from './common/filters/handle-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const authSecurityService = app.get(AuthSecurityService);
  const allowedOrigins = config.get<string[]>('app.cors.allowedOrigins', []);
  const csrfHeaderName = authSecurityService.csrfHeaderName;
  authSecurityService.assertCookieSecurityConfig();

  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', csrfHeaderName],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });


  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  
  console.log("Application is running on: http://localhost:" + (process.env.PORT ?? 3000));
  await app.listen(process.env.PORT ?? 3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
