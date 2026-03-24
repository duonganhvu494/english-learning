export class LectureCreatedEvent {
  static readonly eventName = 'lecture.created';

  constructor(
    public readonly lectureId: string,
    public readonly sessionId: string,
    public readonly actorUserId: string,
  ) {}
}
