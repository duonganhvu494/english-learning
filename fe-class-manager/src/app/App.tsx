import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";

import LandingPage from "@/app/pages/LandingPage";

import LoginPage from "@/app/pages/auth/LoginPage";
import RegisterPage from "@/app/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/app/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/app/pages/auth/ResetPasswordPage";
import ChangePasswordPage from "@/app/pages/auth/ChangePasswordPage";

import adminRoutes from "@/app/routes/AdminRoutes";
import studentRoutes from "@/app/routes/StudentRoutes";

import AuthenticatedLayout from "@/app/layouts/AuthenticatedLayout";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/change-password", element: <ChangePasswordPage /> },

  {
    element: <AuthenticatedLayout />,
    children: [...adminRoutes, ...studentRoutes],
  },
]);

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </>
  );
}
