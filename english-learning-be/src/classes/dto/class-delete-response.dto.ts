export class ClassDeleteResponseDto {
  classId: string;

  static fromData(input: { classId: string }): ClassDeleteResponseDto {
    const dto = new ClassDeleteResponseDto();
    dto.classId = input.classId;
    return dto;
  }
}
