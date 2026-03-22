export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledClasses: string[];
  progress: number;
  completedProjects: number;
  joinedDate: string;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  schedule: string;
  studentCount: number;
  thumbnail?: string;
  color: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "Active" | "Draft" | "Completed";
}

export interface Project {
  id: string;
  title: string;
  description: string;
  classId: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  status: "Draft" | "Published";
  totalPoints: number;
  submissions: {
    studentId: string;
    submittedAt?: string;
    score?: number;
    status: "Not Submitted" | "Submitted" | "Graded";
  }[];
}

export interface CalendarEvent {
  id: string;
  classId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "Class" | "Assignment Due" | "Exam" | "Event";
  color: string;
}
