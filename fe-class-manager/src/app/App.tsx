import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "sonner";

import LandingPage from "@/app/pages/LandingPage";

import LoginPage from "@/app/pages/auth/LoginPage";
import RegisterPage from "@/app/pages/auth/RegisterPage";
import VerifyEmailPage from "@/app/pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "@/app/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/app/pages/auth/ResetPasswordPage";
import ChangePasswordPage from "@/app/pages/auth/ChangePasswordPage";

import AdminRoutes from "@/app/routes/AdminRoutes";
import StudentRoutes from "@/app/routes/StudentRoutes";

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
        <Route path="/change-password" element={<ChangePasswordPage />} />
        {AdminRoutes()}
        {StudentRoutes()}
      </Routes>
    </BrowserRouter>
  );
}
