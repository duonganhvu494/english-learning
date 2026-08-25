import { Navigate } from "react-router";
import type { RouteObject } from "react-router";
import RequireRole from "@/app/routes/RequireRole";
import StudentLayout from "@/app/layouts/StudentLayout";

import StudentClassesPage from "@/app/pages/student/StudentClassesPage";
import StudentAssignmentsPage from "@/app/pages/student/StudentAssignmentsPage";
import StudentClassroom from "@/app/pages/student/StudentClassroom";
import StudentAssignment from "@/app/pages/student/StudentAssignment";
import NotificationsPage from "../pages/notifications/NotificationsPage";

const studentRoutes: RouteObject[] = [
  {
    element: <RequireRole role="student" />,
    children: [
      {
        path: "/student",
        element: <StudentLayout />,
        children: [
          { index: true, element: <Navigate to="/student/classes" replace /> },
          { path: "classes", element: <StudentClassesPage /> },
          { path: "classes/:classId", element: <StudentClassroom /> },
          { path: "assignments", element: <StudentAssignmentsPage /> },
          { path: "assignments/:assignmentId", element: <StudentAssignment /> },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
        ],
      },
    ],
  },
];

export default studentRoutes;
