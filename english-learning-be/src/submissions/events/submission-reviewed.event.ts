export class SubmissionReviewedEvent {
  static readonly eventName = 'submission.reviewed';

  constructor(
    public readonly assignmentId: string,
    public readonly studentId: string,
    public readonly reviewerUserId: string,
    public readonly reviewedAt: string,
  ) {}
}
