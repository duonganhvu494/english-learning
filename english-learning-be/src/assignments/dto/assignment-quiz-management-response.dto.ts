import { AssignmentEntity } from '../entities/assignment.entity';
import { AssignmentQuizQuestionManagementResponseDto } from './assignment-quiz-question-management-response.dto';

export class AssignmentQuizManagementResponseDto {
  assignmentId: string;
  title: string;
  timeStart: Date;
  timeEnd: Date;
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
