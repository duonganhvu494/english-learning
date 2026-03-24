export class AssignmentCreatedEvent {
  static readonly eventName = 'assignment.created';

  constructor(
    public readonly assignmentId: string,
    public readonly sessionId: string,
    public readonly actorUserId: string,
  ) {}
}
