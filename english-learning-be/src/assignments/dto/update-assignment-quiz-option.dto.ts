import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentQuizOptionDto } from './create-assignment-quiz-option.dto';

export class UpdateAssignmentQuizOptionDto extends PartialType(
  CreateAssignmentQuizOptionDto,
) {}
