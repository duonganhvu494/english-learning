export type CreateClassRequest = {
  className: string;
  description?: string;
};

export type UpdateClassRequest = Partial<CreateClassRequest>;

export type WorkspaceClass = {
  id: string;
  className: string;
  description?: string | null;
  workspaceId: string;
  studentCount: number;
};

export type DeleteClassResponse = {
  classId: string;
};

export type ClassStudentListItem = {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  classRoleId: string | null;
  classRoleName: string | null;
};

export type ClassRosterResponse = {
  classId: string;
  students: ClassStudentListItem[];
};

export type AddClassStudentsRequest = {
  studentIds: string[];
};

export type ClassStudentsResponse = {
  classId: string;
  studentIds: string[];
};
