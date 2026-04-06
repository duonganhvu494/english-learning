import { DICTIONARIES } from "@/i18n";
import { AuthBrandPanel } from "@/components/common/auth-brand-panel";
import { LoginForm } from "@/components/auth/login/login-form";
import { PageTitle } from "@/components/common/page-title";

const metadataDictionary = DICTIONARIES.vi;

export const metadata = {
  title: `${metadataDictionary.login.formTitle} - ${metadataDictionary.appName}`,
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
