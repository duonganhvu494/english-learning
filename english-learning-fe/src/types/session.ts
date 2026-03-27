export type CreateSessionRequest = {
  timeStart: string;
  timeEnd: string;
  topic: string;
};

export type UpdateSessionRequest = Partial<CreateSessionRequest>;

export type ClassSession = {
  id: string;
  code: string | null;
  classId: string;
  workspaceId: string;
  timeStart: string;
  timeEnd: string;
  topic: string;
};

export type DeleteSessionResponse = {
  sessionId: string;
};
