import { Navigate } from "react-router";
import type { RouteObject } from "react-router";
import RequireRole from "@/app/routes/RequireRole";
import AdminLayout from "@/app/layouts/AdminLayout";

import Dashboard from "@/app/pages/admin/Dashboard";
import StudentsPage from "@/app/pages/admin/students/StudentsPage";
import StudentDetailPage from "@/app/pages/admin/students/StudentDetailPage";
import ClassesPage from "@/app/pages/admin/classes/ClassesPage";
import ClassDetailPage from "@/app/pages/admin/classes/ClassDetailPage";
import SessionDetailPage from "@/app/pages/admin/sessions/SessionDetailPage";

import AssignmentDetailPage from "@/app/pages/admin/assignments/AssignmentDetailPage";
import QuizManagementPage from "@/app/pages/admin/assignments/quiz/QuizManagementPage";
import QuizAttemptsPage from "@/app/pages/admin/assignments/quiz/QuizAttemptsPage";

import SubmissionsPage from "@/app/pages/admin/submissions/SubmissionsPage";
import MaterialsPage from "@/app/pages/admin/materials/MaterialsPage";
import BillingPage from "@/app/pages/admin/billings/BillingPage";
import SettingsPage from "@/app/pages/admin/SettingsPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";

const adminRoutes: RouteObject[] = [
  {
    element: <RequireRole role="teacher" />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },

          { path: "students", element: <StudentsPage /> },
          { path: "students/:studentId", element: <StudentDetailPage /> },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },

          { path: "classes", element: <ClassesPage /> },
          { path: "classes/:classId", element: <ClassDetailPage /> },

          { path: "sessions/:sessionId", element: <SessionDetailPage /> },

          {
            path: "assignments/:assignmentId",
            element: <AssignmentDetailPage />,
          },
          {
            path: "assignments/:assignmentId/quiz",
            element: <QuizManagementPage />,
          },
          {
            path: "assignments/:assignmentId/quiz/attempts",
            element: <QuizAttemptsPage />,
          },
          {
            path: "assignments/:assignmentId/submissions",
            element: <SubmissionsPage />,
          },

          { path: "materials", element: <MaterialsPage /> },
          { path: "billing", element: <BillingPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
];

export default adminRoutes;
