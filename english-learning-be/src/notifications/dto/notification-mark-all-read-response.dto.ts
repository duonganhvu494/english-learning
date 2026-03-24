import { ApiProperty } from '@nestjs/swagger';

export class NotificationMarkAllReadResponseDto {
  @ApiProperty({ example: 5 })
  updatedCount: number;

  static fromData(input: {
    updatedCount: number;
  }): NotificationMarkAllReadResponseDto {
    const dto = new NotificationMarkAllReadResponseDto();
    dto.updatedCount = input.updatedCount;
    return dto;
  }
}
