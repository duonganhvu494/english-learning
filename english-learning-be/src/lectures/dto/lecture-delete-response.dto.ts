import { ApiProperty } from '@nestjs/swagger';

export class LectureDeleteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440600' })
  lectureId: string;

  static fromData(input: { lectureId: string }): LectureDeleteResponseDto {
    const dto = new LectureDeleteResponseDto();
    dto.lectureId = input.lectureId;
    return dto;
  }
}
