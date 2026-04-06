export type SubmissionMaterialSummary = {
 id: string;
 title: string;
 downloadUrl: string;
 fileName: string;
 mimeType: string | null;
 size: number | null;
 category: string;
};

export type AssignmentSubmission = {
 assignmentId: string;
 studentId: string;
 studentName: string | null;
 submitted: boolean;
 submittedAt: string | null;
 grade: number | null;
 feedback: string | null;
 material: SubmissionMaterialSummary | null;
};

export type ReviewSubmissionRequest = {
 grade?: number;
 feedback?: string;
};
