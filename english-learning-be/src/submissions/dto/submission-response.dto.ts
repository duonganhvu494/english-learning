import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';
import { User } from 'src/users/entities/user.entity';
import { SubmissionEntity } from '../entities/submission.entity';

export class SubmissionResponseDto {
  assignmentId: string;
  studentId: string;
  studentName: string | null;
  submitted: boolean;
  submittedAt: Date | null;
  grade: number | null;
  feedback: string | null;
  material: MaterialSummaryDto | null;

  static fromEntity(
    submission: SubmissionEntity,
    downloadUrl: string,
  ): SubmissionResponseDto {
    const dto = new SubmissionResponseDto();
    dto.assignmentId = submission.assignment.id;
    dto.studentId = submission.student.id;
    dto.studentName = this.resolveStudentName(submission.student);
    dto.submitted = true;
    dto.submittedAt = submission.submittedAt;
    dto.grade = submission.grade;
    dto.feedback = submission.feedback;
    dto.material = MaterialSummaryDto.fromEntity(submission.material, downloadUrl);
    return dto;
  }

  static empty(input: {
    assignmentId: string;
    student: User;
  }): SubmissionResponseDto {
    const dto = new SubmissionResponseDto();
    dto.assignmentId = input.assignmentId;
    dto.studentId = input.student.id;
    dto.studentName = this.resolveStudentName(input.student);
    dto.submitted = false;
    dto.submittedAt = null;
    dto.grade = null;
    dto.feedback = null;
    dto.material = null;
    return dto;
  }

  private static resolveStudentName(student: User): string | null {
    return student.fullName || student.userName || student.email || null;
  }
}
