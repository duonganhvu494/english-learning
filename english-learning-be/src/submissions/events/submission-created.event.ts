export class SubmissionCreatedEvent {
  static readonly eventName = 'submission.created';

  constructor(
    public readonly assignmentId: string,
    public readonly studentId: string,
    public readonly submitterUserId: string,
    public readonly submittedAt: string,
    public readonly isResubmission: boolean,
  ) {}
}
