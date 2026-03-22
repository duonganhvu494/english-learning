import { ApiProperty } from '@nestjs/swagger';

export class UserDeleteResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the user was soft-deleted successfully',
  })
  deleted: boolean;
}
