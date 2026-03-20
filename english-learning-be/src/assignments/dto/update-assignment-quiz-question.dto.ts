import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentQuizQuestionDto } from './create-assignment-quiz-question.dto';

export class UpdateAssignmentQuizQuestionDto extends PartialType(
  CreateAssignmentQuizQuestionDto,
) {}
