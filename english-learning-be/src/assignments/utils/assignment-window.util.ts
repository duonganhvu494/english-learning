import { AssignmentEntity } from '../entities/assignment.entity';

export enum AssignmentStatus {
  UPCOMING = 'upcoming',
  OPEN = 'open',
  CLOSED = 'closed',
}

type AssignmentWindow = Pick<AssignmentEntity, 'timeStart' | 'timeEnd'>;

export const resolveAssignmentStatus = (
  assignment: AssignmentWindow,
  nowMs = Date.now(),
): AssignmentStatus => {
  if (nowMs < assignment.timeStart.getTime()) {
    return AssignmentStatus.UPCOMING;
  }

  if (nowMs > assignment.timeEnd.getTime()) {
    return AssignmentStatus.CLOSED;
  }

  return AssignmentStatus.OPEN;
};
