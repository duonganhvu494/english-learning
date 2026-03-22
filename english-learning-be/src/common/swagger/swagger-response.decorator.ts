import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse as SwaggerApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { ApiErrorResponseDto } from './dto/api-error-response.dto';

type SwaggerModel = Type<unknown>;

type EnvelopeOptions = {
  status?: number;
  description: string;
  model?: SwaggerModel;
  isArray?: boolean;
  isNullable?: boolean;
  exampleMessage?: string;
  exampleResult?: unknown;
};

type BusinessErrorDoc = {
  status: number;
  code: string;
  message: string;
  description?: string;
};

const buildResultSchema = (
  model?: SwaggerModel,
  isArray = false,
  isNullable = false,
): Record<string, unknown> => {
  if (!model) {
    return {
      type: 'null',
      nullable: true,
      example: null,
    };
  }

  const baseSchema = {
    $ref: getSchemaPath(model),
  };

  if (isArray) {
    return {
      type: 'array',
      items: baseSchema,
      nullable: isNullable,
    };
  }

  return {
    ...baseSchema,
    nullable: isNullable,
  };
};

export const ApiEnvelopeResponse = ({
  status = 200,
  description,
  model,
  isArray = false,
  isNullable = false,
  exampleMessage = 'Success',
  exampleResult,
}: EnvelopeOptions) => {
  const models: Array<SwaggerModel | typeof ApiResponse> = [ApiResponse];
  if (model) {
    models.push(model);
  }

  return applyDecorators(
    ApiExtraModels(...models),
    SwaggerApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: status,
          },
          message: {
            type: 'string',
            example: exampleMessage,
          },
          result: buildResultSchema(model, isArray, isNullable),
          code: {
            type: 'string',
            nullable: true,
            example: null,
          },
        },
        required: ['statusCode', 'message', 'result'],
        example: {
          statusCode: status,
          message: exampleMessage,
          result: exampleResult !== undefined ? exampleResult : isArray ? [] : null,
          code: null,
        },
      },
    }),
  );
};

export const ApiBusinessErrorResponses = (errors: BusinessErrorDoc[]) => {
  const groupedByStatus = new Map<number, BusinessErrorDoc[]>();

  errors.forEach((error) => {
    const group = groupedByStatus.get(error.status) ?? [];
    group.push(error);
    groupedByStatus.set(error.status, group);
  });

  return applyDecorators(
    ...Array.from(groupedByStatus.entries()).map(([status, group]) =>
      applyDecorators(
        ApiExtraModels(ApiErrorResponseDto),
        SwaggerApiResponse({
          status,
          description:
            group[0]?.description ??
            group.map((error) => error.code).join(', '),
          content: {
            'application/json': {
              schema: {
                $ref: getSchemaPath(ApiErrorResponseDto),
              },
              examples: Object.fromEntries(
                group.map((error) => [
                  error.code,
                  {
                    summary: error.code,
                    description: error.description ?? error.message,
                    value: {
                      statusCode: status,
                      message: error.message,
                      result: null,
                      code: error.code,
                    },
                  },
                ]),
              ),
            },
          },
        }),
      ),
    ),
  );
};
