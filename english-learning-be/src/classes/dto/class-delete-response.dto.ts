import { ApiProperty } from '@nestjs/swagger';

export class ClassDeleteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  static fromData(input: { classId: string }): ClassDeleteResponseDto {
    const dto = new ClassDeleteResponseDto();
    dto.classId = input.classId;
    return dto;
  }
}
