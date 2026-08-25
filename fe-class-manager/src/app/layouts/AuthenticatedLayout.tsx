import { Outlet } from "react-router";
import { NotificationProvider } from "@/app/providers/NotificationProvider";

export default function AuthenticatedLayout() {
  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
}