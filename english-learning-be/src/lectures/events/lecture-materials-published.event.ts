export class LectureMaterialsPublishedEvent {
  static readonly eventName = 'lecture.materials_published';

  constructor(
    public readonly lectureId: string,
    public readonly sessionId: string,
    public readonly actorUserId: string,
    public readonly materialIds: string[],
    public readonly publishedAt: string,
  ) {}
}
