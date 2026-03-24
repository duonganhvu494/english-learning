export class SessionCreatedEvent {
  static readonly eventName = 'session.created';

  constructor(
    public readonly sessionId: string,
    public readonly classId: string,
  ) {}
}
