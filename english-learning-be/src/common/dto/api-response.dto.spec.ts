import { ApiResponse } from './api-response.dto';

describe('ApiResponse', () => {
  it('creates a success response without a code by default', () => {
    expect(ApiResponse.success({ id: 'item-1' }, 'Item fetched')).toEqual({
      statusCode: 200,
      message: 'Item fetched',
      result: { id: 'item-1' },
    });
  });

  it('supports an explicit response code for frontend i18n mapping', () => {
    expect(
      ApiResponse.success(
        { id: 'item-1' },
        'Item created',
        201,
        'ITEM_CREATED',
      ),
    ).toEqual({
      statusCode: 201,
      message: 'Item created',
      result: { id: 'item-1' },
      code: 'ITEM_CREATED',
    });
  });

  it('creates an error response with a code', () => {
    expect(ApiResponse.error(400, 'Email already exists', 'EMAIL_EXISTS')).toEqual(
      {
        statusCode: 400,
        message: 'Email already exists',
        result: null,
        code: 'EMAIL_EXISTS',
      },
    );
  });
});
