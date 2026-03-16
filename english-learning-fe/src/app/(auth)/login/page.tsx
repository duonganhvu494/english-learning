import { AuthBrandPanel } from "@/components/common/auth-brand-panel";
import { LoginForm } from "@/components/login/login-form";
import { PageTitle } from "@/components/common/page-title";

export const metadata = {
  title: "Đăng nhập - English Learning",
};

export default function LoginPage() {
  return (
    <>
      <PageTitle page="login" />
      <AuthBrandPanel />
      <LoginForm />
    </>
  );
}
