import { AuthBrandPanel } from "@/components/common/auth-brand-panel";
import { SignUpForm } from "@/components/sign-up/sign-up-form";
import { PageTitle } from "@/components/common/page-title";

export const metadata = {
  title: "Đăng ký - English Learning",
};

export default function SignUpPage() {
  return (
    <>
      <PageTitle page="signUp" />
      <AuthBrandPanel useSignUp={true} />
      <SignUpForm />
    </>
  );
}
