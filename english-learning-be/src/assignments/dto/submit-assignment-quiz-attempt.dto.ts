import {
  ArrayUnique,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SubmitAssignmentQuizAttemptAnswerDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440010',
    description: 'Quiz question ID',
  })
  @IsUUID('4', { message: 'questionId must be a valid UUID' })
  questionId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440020',
    description: 'Selected option ID',
  })
  @IsUUID('4', { message: 'selectedOptionId must be a valid UUID' })
  selectedOptionId: string;
}

export class SubmitAssignmentQuizAttemptDto {
  @ApiProperty({
    description: 'Submitted answers for the quiz attempt',
    type: [SubmitAssignmentQuizAttemptAnswerDto],
  })
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
