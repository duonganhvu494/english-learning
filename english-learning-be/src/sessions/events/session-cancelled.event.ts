export class SessionCancelledEvent {
  static readonly eventName = 'session.cancelled';

  constructor(
    public readonly sessionId: string,
    public readonly workspaceId: string,
    public readonly classId: string,
    public readonly topic: string,
    public readonly timeStart: string,
    public readonly timeEnd: string,
    public readonly cancelledAt: string,
  ) {}
}
