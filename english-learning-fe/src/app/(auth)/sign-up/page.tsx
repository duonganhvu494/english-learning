import { DICTIONARIES } from "@/i18n";
import { AuthBrandPanel } from "@/components/common/auth-brand-panel";
import { SignUpForm } from "@/components/auth/sign-up/sign-up-form";
import { PageTitle } from "@/components/common/page-title";

const metadataDictionary = DICTIONARIES.vi;

export const metadata = {
  title: `${metadataDictionary.signUp.formTitle} - ${metadataDictionary.appName}`,
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
