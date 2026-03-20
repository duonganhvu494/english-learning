export class AssignmentDeleteResponseDto {
  assignmentId: string;

  static fromData(input: {
    assignmentId: string;
  }): AssignmentDeleteResponseDto {
    const dto = new AssignmentDeleteResponseDto();
    dto.assignmentId = input.assignmentId;
    return dto;
  }
}
