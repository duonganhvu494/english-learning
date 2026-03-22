import { ApiProperty } from '@nestjs/swagger';
import { AssignmentEntity } from '../entities/assignment.entity';
import { AssignmentQuizQuestionManagementResponseDto } from './assignment-quiz-question-management-response.dto';

export class AssignmentQuizManagementResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440800' })
  assignmentId: string;

  @ApiProperty({ example: 'Quiz 01' })
  title: string;

  @ApiProperty({ example: '2026-03-25T08:00:00.000Z' })
  timeStart: Date;

  @ApiProperty({ example: '2026-03-27T23:59:59.000Z' })
  timeEnd: Date;

  @ApiProperty({ type: [AssignmentQuizQuestionManagementResponseDto] })
  questions: AssignmentQuizQuestionManagementResponseDto[];

  static fromEntity(
    assignment: AssignmentEntity,
  ): AssignmentQuizManagementResponseDto {
    const dto = new AssignmentQuizManagementResponseDto();
    dto.assignmentId = assignment.id;
    dto.title = assignment.title;
    dto.timeStart = assignment.timeStart;
    dto.timeEnd = assignment.timeEnd;
    dto.questions = [...(assignment.quizQuestions ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) =>
        AssignmentQuizQuestionManagementResponseDto.fromEntity(
          question,
          assignment.id,
        ),
      );
    return dto;
  }
}
