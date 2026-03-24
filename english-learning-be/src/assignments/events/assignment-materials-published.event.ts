export class AssignmentMaterialsPublishedEvent {
  static readonly eventName = 'assignment.materials_published';

  constructor(
    public readonly assignmentId: string,
    public readonly sessionId: string,
    public readonly actorUserId: string,
    public readonly materialIds: string[],
    public readonly publishedAt: string,
  ) {}
}
