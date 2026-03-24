import { RequireAuth } from "@/components/auth/route-guards";

export default function MyCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
