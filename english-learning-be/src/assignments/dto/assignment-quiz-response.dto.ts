import { AssignmentEntity } from '../entities/assignment.entity';
import { AssignmentQuizQuestionResponseDto } from './assignment-quiz-question-response.dto';
import {
  AssignmentStatus,
  resolveAssignmentStatus,
} from '../utils/assignment-window.util';

export class AssignmentQuizResponseDto {
  assignmentId: string;
  title: string;
  timeStart: Date;
  timeEnd: Date;
  status: AssignmentStatus;
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
