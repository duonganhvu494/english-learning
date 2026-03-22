import { ApiProperty } from '@nestjs/swagger';

export class AssignmentQuizOptionDeleteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440820' })
  optionId: string;
}
