import { RequireAuth } from "@/components/auth/route-guards";
import { DashboardHeader } from "@/components/layout/main-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <DashboardHeader />
        <main className="space-y-6 px-4 md:px-6 lg:px-8 xl:px-10">{children}</main>
      </div>
    </RequireAuth>
  );
}
