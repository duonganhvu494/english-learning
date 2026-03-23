import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddClassStudentsDto {
  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
    description: 'List of student user IDs to add into the class',
    type: [String],
  })
  @IsArray({ message: 'studentIds must be an array' })
  @ArrayMinSize(1, { message: 'studentIds must contain at least 1 item' })
  @ArrayUnique({ message: 'studentIds contains duplicated values' })
  @IsUUID('4', { each: true, message: 'each studentId must be a valid UUID' })
  studentIds: string[];
}
