import { Navigate, Outlet } from "react-router";
import { getCurrentUser } from "@/app/utils/client-storage";

interface RequireRoleProps {
  role: "teacher" | "student";
}

export default function RequireRole({ role }: RequireRoleProps) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role !== role) {
    return (
      <Navigate
        to={user.role === "student" ? "/student/dashboard" : "/admin/dashboard"}
        replace
      />
    );
  }

  return <Outlet />;
}
