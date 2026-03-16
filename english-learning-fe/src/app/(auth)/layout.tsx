import { Header } from "@/components/layout/header";

export const metadata = {
  title: "Đăng nhập / Đăng ký - English Learning",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <Header />
      <main className="container-app grid min-h-screen grid-cols-1 items-center gap-10 pt-24 pb-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        {children}
      </main>
    </div>
  );
}
