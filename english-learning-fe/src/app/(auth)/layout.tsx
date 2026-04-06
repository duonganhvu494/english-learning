import { DICTIONARIES } from "@/i18n";
import { Header } from "@/components/layout/auth-header";
import { RedirectIfAuthenticated } from "@/components/auth/route-guards";

const metadataDictionary = DICTIONARIES.vi;

export const metadata = {
  title: `${metadataDictionary.login.formTitle} / ${metadataDictionary.signUp.formTitle} - ${metadataDictionary.appName}`,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen bg-(--color-bg)">
        <Header />
        <main className="container-app grid min-h-screen grid-cols-1 items-center gap-10 pt-24 pb-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          {children}
        </main>
      </div>
    </RedirectIfAuthenticated>
  );
}
