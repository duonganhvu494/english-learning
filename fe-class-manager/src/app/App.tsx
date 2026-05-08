import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import ClassesPage from "./pages/admin/ClassesPage";
import ClassDetailPage from "./pages/admin/ClassDetailPage";
import SessionDetailPage from "./pages/admin/SessionDetailPage";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import MaterialsPage from "./pages/admin/MaterialsPage";
import BillingPage from "./pages/admin/BillingPage";
import SettingsPage from "./pages/admin/SettingsPage";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClassroom from "./pages/student/StudentClassroom";
import StudentAssignment from "./pages/student/StudentAssignment";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId" element={<ClassDetailPage />} />
          <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
          <Route
            path="assignments/:assignmentId/submissions"
            element={<SubmissionsPage />}
          />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="class/:classId" element={<StudentClassroom />} />
          <Route
            path="assignment/:assignmentId"
            element={<StudentAssignment />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
