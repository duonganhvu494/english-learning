import { UserProfile } from "./users";

export interface CreateClassDto {
  className: string;
  description?: string;
}

export interface UpdateClassDto {
  className?: string;
  description?: string;
}

export interface ClassResponse {
  id: string;
  className: string;
  description: string | null;
  workspaceId: string;
  studentCount: number;
}

export interface ClassStudentListItem {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  classRoleId: string | null;
  classRoleName: string | null;
}

export interface ClassRosterResponse {
  classId: string;
  students: ClassStudentListItem[];
}

export interface AddClassStudentsDto {
  studentIds: string[];
}

export interface ClassStudentsResponse {
  classId: string;
  studentIds: string[];
}

export interface CreateStudentDto {
  fullName: string;
  email: string;
}

export interface CreateClassStudentResponse {
  classId: string;
  workspaceId: string;
  mode: "created" | "attached" | "already_assigned";
  workspaceRole: string;
  classRoleId: string;
  classRoleName: string;
  user: UserProfile;
}

export interface ClassDeleteResponse {
  classId: string;
}

export interface UpdateClassStudentRoleDto {
  roleId?: string | null;
}

export interface ClassStudentRoleResponse {
  classId: string;
  studentId: string;
  roleId: string | null;
  roleName: string | null;
}