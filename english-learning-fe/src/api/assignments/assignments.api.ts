import { httpClient } from '@/api/core/http-client';
import type {
 AssignmentQuizAttempt,
 CreateSessionAssignmentRequest,
 DeleteAssignmentResponse,
 SessionAssignment,
} from '@/types/assignment';

export const assignmentsApi = {
 createAssignment: (sessionId: string, payload: CreateSessionAssignmentRequest) =>
 httpClient.post<SessionAssignment>('/sessions/' + sessionId + '/assignments', payload),
 listSessionAssignments: (sessionId: string) =>
 httpClient.get<SessionAssignment[]>('/sessions/' + sessionId + '/assignments'),
 getAssignmentDetail: (assignmentId: string) =>
 httpClient.get<SessionAssignment>('/assignments/' + assignmentId),
 listQuizAttempts: (assignmentId: string) =>
 httpClient.get<AssignmentQuizAttempt[]>('/assignments/' + assignmentId + '/quiz/attempts'),
 deleteAssignment: (assignmentId: string) =>
 httpClient.remove<DeleteAssignmentResponse>('/assignments/' + assignmentId),
};
