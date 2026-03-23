import { ApiProperty } from '@nestjs/swagger';

export class ClassStudentsResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  })
  studentIds: string[];

  static fromData(input: {
    classId: string;
    studentIds: string[];
  }): ClassStudentsResponseDto {
    const dto = new ClassStudentsResponseDto();
    dto.classId = input.classId;
    dto.studentIds = [...input.studentIds].sort();
    return dto;
  }
}
