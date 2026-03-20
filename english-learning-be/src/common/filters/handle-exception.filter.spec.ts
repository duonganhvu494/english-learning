import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './handle-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('uses an explicit error code when the exception provides one', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json };
    const host = createHost(response);

    filter.catch(
      new BadRequestException({
        message: 'Email already exists',
        code: 'EMAIL_ALREADY_EXISTS',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Email already exists',
      result: null,
      code: 'EMAIL_ALREADY_EXISTS',
    });
  });

  it('falls back to a validation error code for validation arrays', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json };
    const host = createHost(response);

    filter.catch(
      new BadRequestException({
        message: ['Email is invalid', 'Password is too short'],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Email is invalid, Password is too short',
      result: null,
      code: 'VALIDATION_ERROR',
    });
  });
});

function createHost(response: {
  status: jest.Mock;
  json: jest.Mock;
}): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({
        method: 'POST',
        url: '/test',
      }),
    }),
  } as ArgumentsHost;
}
