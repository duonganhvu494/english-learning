import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AddClassStudentsDto {
  @IsArray({ message: 'studentIds must be an array' })
  @ArrayMinSize(1, { message: 'studentIds must contain at least 1 item' })
  @ArrayUnique({ message: 'studentIds contains duplicated values' })
  @IsUUID('4', { each: true, message: 'each studentId must be a valid UUID' })
  studentIds: string[];
}
