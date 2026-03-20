import {
  ArrayUnique,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubmitAssignmentQuizAttemptAnswerDto {
  @IsUUID('4', { message: 'questionId must be a valid UUID' })
  questionId: string;

  @IsUUID('4', { message: 'selectedOptionId must be a valid UUID' })
  selectedOptionId: string;
}

export class SubmitAssignmentQuizAttemptDto {
  @IsArray({ message: 'answers must be an array' })
  @ArrayUnique(
    (answer: SubmitAssignmentQuizAttemptAnswerDto) => answer.questionId,
    {
      message: 'answers contains duplicate questionIds',
    },
  )
  @ValidateNested({ each: true })
  @Type(() => SubmitAssignmentQuizAttemptAnswerDto)
  answers: SubmitAssignmentQuizAttemptAnswerDto[];
}
