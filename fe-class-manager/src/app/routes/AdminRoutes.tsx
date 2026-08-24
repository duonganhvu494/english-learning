import { Navigate, Route } from "react-router";

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

export default function AdminRoutes() {
  return (
    <Route element={<RequireRole role="teacher" />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId" element={<StudentDetailPage />} />

        <Route path="classes" element={<ClassesPage />} />

        <Route path="classes/:classId" element={<ClassDetailPage />} />

        <Route path="sessions/:sessionId" element={<SessionDetailPage />} />

        <Route
          path="assignments/:assignmentId"
          element={<AssignmentDetailPage />}
        />

        <Route
          path="assignments/:assignmentId/quiz"
          element={<QuizManagementPage />}
        />

        <Route
          path="assignments/:assignmentId/quiz/attempts"
          element={<QuizAttemptsPage />}
        />

        <Route
          path="assignments/:assignmentId/submissions"
          element={<SubmissionsPage />}
        />

        <Route path="materials" element={<MaterialsPage />} />

        <Route path="billing" element={<BillingPage />} />

        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>
  );
}
