export class SessionUpdatedEvent {
  static readonly eventName = 'session.updated';

  constructor(
    public readonly sessionId: string,
    public readonly previousTopic: string,
    public readonly previousTimeStart: string,
    public readonly previousTimeEnd: string,
    public readonly updatedAt: string,
  ) {}
}
