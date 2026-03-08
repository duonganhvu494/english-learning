export class ClassStudentsResponseDto {
  classId: string;
  studentIds: string[];

  static fromData(input: {
    classId: string;
    studentIds: string[];
  }): ClassStudentsResponseDto {
    const dto = new ClassStudentsResponseDto();
    dto.classId = input.classId;
    dto.studentIds = [...input.studentIds].sort();
    return dto;
  }
}
