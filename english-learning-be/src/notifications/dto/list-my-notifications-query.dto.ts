import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListMyNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'Return only unread notifications',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }

    return value === true || value === 'true';
  })
  @IsBoolean({ message: 'unreadOnly must be a boolean' })
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of notifications to return',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must be at most 100' })
  limit?: number;
}
