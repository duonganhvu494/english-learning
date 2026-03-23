import { ApiProperty } from '@nestjs/swagger';
import { AssignmentEntity } from '../entities/assignment.entity';
import { AssignmentQuizQuestionResponseDto } from './assignment-quiz-question-response.dto';
import {
  AssignmentStatus,
  resolveAssignmentStatus,
} from '../utils/assignment-window.util';

export class AssignmentQuizResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440800' })
  assignmentId: string;

  @ApiProperty({ example: 'Quiz 01' })
  title: string;

  @ApiProperty({ example: '2026-03-25T08:00:00.000Z' })
  timeStart: Date;

  @ApiProperty({ example: '2026-03-27T23:59:59.000Z' })
  timeEnd: Date;

  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.OPEN })
  status: AssignmentStatus;

  @ApiProperty({ type: [AssignmentQuizQuestionResponseDto] })
  questions: AssignmentQuizQuestionResponseDto[];

  static fromEntity(assignment: AssignmentEntity): AssignmentQuizResponseDto {
    const dto = new AssignmentQuizResponseDto();
    dto.assignmentId = assignment.id;
    dto.title = assignment.title;
    dto.timeStart = assignment.timeStart;
    dto.timeEnd = assignment.timeEnd;
    dto.status = resolveAssignmentStatus(assignment);
    dto.questions = [...(assignment.quizQuestions ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) =>
        AssignmentQuizQuestionResponseDto.fromEntity(question, assignment.id),
      );
    return dto;
  }
}
