export class LectureDeleteResponseDto {
  lectureId: string;

  static fromData(input: { lectureId: string }): LectureDeleteResponseDto {
    const dto = new LectureDeleteResponseDto();
    dto.lectureId = input.lectureId;
    return dto;
  }
}
