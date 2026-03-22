"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Student,
  Class,
  Project,
  Assignment,
  CalendarEvent,
} from "../types/types";

interface DataContextType {
  classes: Class[];
  students: Student[];
  projects: Project[];
  assignments: Assignment[];
  calendarEvents: CalendarEvent[];
  addClass: (classData: Omit<Class, "id">) => void;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  addStudent: (studentData: Omit<Student, "id">) => void;
  updateStudent: (id: string, studentData: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  enrollStudent: (studentId: string, classId: string) => void;
  unenrollStudent: (studentId: string, classId: string) => void;
  addAssignment: (assignmentData: Omit<Assignment, "id">) => void;
  updateAssignment: (id: string, assignmentData: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  addCalendarEvent: (eventData: Omit<CalendarEvent, "id">) => void;
  updateCalendarEvent: (id: string, eventData: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mockClasses: Class[] = [
  {
    id: "1",
    name: "Figma Fundamentals",
    description: "Learn the basics of Figma interface design",
    schedule: "Mon & Wed, 10:00 AM",
    studentCount: 24,
    color: "#8B5CF6",
    level: "Beginner",
    status: "Active",
  },
  {
    id: "2",
    name: "Advanced Prototyping",
    description: "Master interactive prototypes and animations",
    schedule: "Tue & Thu, 2:00 PM",
    studentCount: 18,
    color: "#3B82F6",
    level: "Advanced",
    status: "Active",
  },
  {
    id: "3",
    name: "Design Systems",
    description: "Build scalable design systems in Figma",
    schedule: "Fri, 11:00 AM",
    studentCount: 15,
    color: "#10B981",
    level: "Intermediate",
    status: "Active",
  },
  {
    id: "4",
    name: "UI/UX Principles",
    description: "Core principles of user interface design",
    schedule: "Mon & Thu, 3:00 PM",
    studentCount: 20,
    color: "#F59E0B",
    level: "Beginner",
    status: "Active",
  },
];

const mockStudents: Student[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    enrolledClasses: ["1", "3"],
    progress: 85,
    completedProjects: 12,
    joinedDate: "2026-01-15",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.c@email.com",
    enrolledClasses: ["1", "2", "4"],
    progress: 72,
    completedProjects: 9,
    joinedDate: "2026-02-01",
  },
  {
    id: "3",
    name: "Emma Williams",
    email: "emma.w@email.com",
    enrolledClasses: ["2", "3"],
    progress: 91,
    completedProjects: 15,
    joinedDate: "2025-12-10",
  },
  {
    id: "4",
    name: "James Rodriguez",
    email: "james.r@email.com",
    enrolledClasses: ["1"],
    progress: 65,
    completedProjects: 6,
    joinedDate: "2026-02-20",
  },
  {
    id: "5",
    name: "Olivia Davis",
    email: "olivia.d@email.com",
    enrolledClasses: ["3", "4"],
    progress: 78,
    completedProjects: 10,
    joinedDate: "2026-01-25",
  },
  {
    id: "6",
    name: "Daniel Kim",
    email: "daniel.k@email.com",
    enrolledClasses: ["2"],
    progress: 88,
    completedProjects: 14,
    joinedDate: "2025-11-30",
  },
];

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Mobile App Design",
    description: "Design a complete mobile app interface",
    classId: "1",
    dueDate: "2026-04-15",
    submittedCount: 20,
    totalStudents: 24,
  },
  {
    id: "2",
    title: "Interactive Prototype",
    description: "Create an interactive prototype with advanced animations",
    classId: "2",
    dueDate: "2026-04-10",
    submittedCount: 15,
    totalStudents: 18,
  },
  {
    id: "3",
    title: "Component Library",
    description: "Build a reusable component library",
    classId: "3",
    dueDate: "2026-04-20",
    submittedCount: 12,
    totalStudents: 15,
  },
];

const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "Wireframe Exercise",
    description: "Create a wireframe for a simple app",
    classId: "1",
    dueDate: "2026-03-28",
    status: "Published",
    totalPoints: 100,
    submissions: [],
  },
  {
    id: "2",
    title: "Prototype Animation",
    description: "Add animations to a prototype",
    classId: "2",
    dueDate: "2026-03-30",
    status: "Published",
    totalPoints: 100,
    submissions: [],
  },
  {
    id: "3",
    title: "Design System Components",
    description: "Design components for a design system",
    classId: "3",
    dueDate: "2026-04-05",
    status: "Published",
    totalPoints: 100,
    submissions: [],
  },
];

const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Class Meeting",
    description: "Weekly class meeting for Figma Fundamentals",
    classId: "1",
    date: "2026-03-24",
    time: "10:00 AM",
    type: "Class",
    color: "#8B5CF6",
  },
  {
    id: "2",
    title: "Assignment Due: Wireframe Exercise",
    description: "Deadline for Wireframe Exercise",
    classId: "1",
    date: "2026-03-28",
    time: "11:59 PM",
    type: "Assignment Due",
    color: "#EF4444",
  },
  {
    id: "3",
    title: "Class Meeting",
    description: "Weekly class meeting for Advanced Prototyping",
    classId: "2",
    date: "2026-03-25",
    time: "2:00 PM",
    type: "Class",
    color: "#3B82F6",
  },
  {
    id: "4",
    title: "Assignment Due: Prototype Animation",
    description: "Deadline for Prototype Animation",
    classId: "2",
    date: "2026-03-30",
    time: "11:59 PM",
    type: "Assignment Due",
    color: "#EF4444",
  },
  {
    id: "5",
    title: "Class Meeting",
    description: "Weekly class meeting for Design Systems",
    classId: "3",
    date: "2026-03-27",
    time: "11:00 AM",
    type: "Class",
    color: "#10B981",
  },
  {
    id: "6",
    title: "Assignment Due: Design System Components",
    description: "Deadline for Design System Components",
    classId: "3",
    date: "2026-04-05",
    time: "11:59 PM",
    type: "Assignment Due",
    color: "#EF4444",
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<Class[]>(mockClasses);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEvent[]>(mockCalendarEvents);

  const addClass = (classData: Omit<Class, "id">) => {
    const newClass: Class = {
      ...classData,
      id: Date.now().toString(),
    };
    setClasses([...classes, newClass]);
  };

  const updateClass = (id: string, classData: Partial<Class>) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, ...classData } : c)));
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter((c) => c.id !== id));
  };

  const addStudent = (studentData: Omit<Student, "id">) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
    };
    setStudents([...students, newStudent]);
  };

  const updateStudent = (id: string, studentData: Partial<Student>) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, ...studentData } : s)),
    );
  };

  const deleteStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const enrollStudent = (studentId: string, classId: string) => {
    setStudents(
      students.map((s) =>
        s.id === studentId
          ? { ...s, enrolledClasses: [...s.enrolledClasses, classId] }
          : s,
      ),
    );
    setClasses(
      classes.map((c) =>
        c.id === classId ? { ...c, studentCount: c.studentCount + 1 } : c,
      ),
    );
  };

  const unenrollStudent = (studentId: string, classId: string) => {
    setStudents(
      students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              enrolledClasses: s.enrolledClasses.filter((id) => id !== classId),
            }
          : s,
      ),
    );
    setClasses(
      classes.map((c) =>
        c.id === classId
          ? { ...c, studentCount: Math.max(0, c.studentCount - 1) }
          : c,
      ),
    );
  };

  const addAssignment = (assignmentData: Omit<Assignment, "id">) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: Date.now().toString(),
    };
    setAssignments([...assignments, newAssignment]);
  };

  const updateAssignment = (
    id: string,
    assignmentData: Partial<Assignment>,
  ) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, ...assignmentData } : a)),
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    };
    setCalendarEvents([...calendarEvents, newEvent]);
  };

  const updateCalendarEvent = (
    id: string,
    eventData: Partial<CalendarEvent>,
  ) => {
    setCalendarEvents(
      calendarEvents.map((e) => (e.id === id ? { ...e, ...eventData } : e)),
    );
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(calendarEvents.filter((e) => e.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        classes,
        students,
        projects,
        assignments,
        calendarEvents,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        enrollStudent,
        unenrollStudent,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
