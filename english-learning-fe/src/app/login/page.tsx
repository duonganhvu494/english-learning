import { Header } from "@/components/login/header";
import { AuthBrandPanel } from "@/components/login/auth-brand-panel";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <Header />

      <main className="container-app grid min-h-screen grid-cols-1 items-center gap-10 pt-24 pb-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <AuthBrandPanel />
        <LoginForm />
      </main>
    </div>
  );
}
