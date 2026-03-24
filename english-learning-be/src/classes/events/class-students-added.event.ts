export class ClassStudentsAddedEvent {
  static readonly eventName = 'class.students_added';

  constructor(
    public readonly workspaceId: string,
    public readonly classId: string,
    public readonly studentIds: string[],
    public readonly addedAt: string,
  ) {}
}
