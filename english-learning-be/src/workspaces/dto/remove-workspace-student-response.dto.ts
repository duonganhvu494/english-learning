export class RemoveWorkspaceStudentResponseDto {
  workspaceId: string;
  studentId: string;
  removedClassCount: number;

  static fromData(input: {
    workspaceId: string;
    studentId: string;
    removedClassCount: number;
  }): RemoveWorkspaceStudentResponseDto {
    const dto = new RemoveWorkspaceStudentResponseDto();
    dto.workspaceId = input.workspaceId;
    dto.studentId = input.studentId;
    dto.removedClassCount = input.removedClassCount;
    return dto;
  }
}
