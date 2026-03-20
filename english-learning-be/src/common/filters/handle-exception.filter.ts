import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiResponse } from '../dto/api-response.dto';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const code = this.getCode(exception, status, message);
    const requestLabel = `[${request.method}] ${request.url}`;

    if (status >= 500) {
      this.logger.error(
        `${requestLabel} ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${requestLabel} ${status} - ${message}`);
    }

    response.status(status).json(ApiResponse.error(status, message, code));
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const message = (response as { message?: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message.join(', ');
      }
    }

    return exception.message || 'Internal server error';
  }

  private getCode(
    exception: unknown,
    status: number,
    message: string,
  ): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const explicitCode = (response as { code?: unknown }).code;
        if (typeof explicitCode === 'string' && explicitCode.trim().length > 0) {
          return explicitCode.trim();
        }

        const rawMessage = (response as { message?: unknown }).message;
        if (Array.isArray(rawMessage)) {
          return 'VALIDATION_ERROR';
        }
      }
    }

    const normalizedCode = message
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();

    if (normalizedCode.length > 0) {
      return normalizedCode;
    }

    return `HTTP_${status}`;
  }
}
