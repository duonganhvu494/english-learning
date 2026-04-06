import { httpClient } from '@/api/core/http-client';
import type {
 AssignmentSubmission,
 ReviewSubmissionRequest,
} from '@/types/submission';

export const submissionsApi = {
 listAssignmentSubmissions: (assignmentId: string) =>
 httpClient.get<AssignmentSubmission[]>('/assignments/' + assignmentId + '/submissions'),
 getMySubmission: (assignmentId: string) =>
 httpClient.get<AssignmentSubmission>('/assignments/' + assignmentId + '/submissions/me'),
 reviewSubmission: (
 assignmentId: string,
 studentId: string,
 payload: ReviewSubmissionRequest,
 ) =>
 httpClient.patch<AssignmentSubmission>(
 '/assignments/' + assignmentId + '/submissions/' + studentId + '/review',
 payload,
 ),
};
