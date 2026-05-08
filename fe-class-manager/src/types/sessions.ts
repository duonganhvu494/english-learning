export interface CreateSessionDto {
  topic: string;
  timeStart: string;
  timeEnd: string;
}

export interface SessionResponse {
  id: string;
  code: string | null;
  classId: string;
  workspaceId: string;
  timeStart: string;
  timeEnd: string;
  topic: string;
}
