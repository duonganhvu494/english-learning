"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type GuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type RequireAuthProps = GuardProps & {
  redirectTo?: string;
};

type RedirectIfAuthenticatedProps = GuardProps & {
  redirectTo?: string;
};

const defaultFallback = (
  <div className="flex min-h-screen items-center justify-center text-sm text-app-text-muted">
    Loading...
  </div>
);

export function RequireAuth({
  children,
  redirectTo = "/login",
  fallback = defaultFallback,
}: RequireAuthProps) {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(redirectTo);
    }
  }, [redirectTo, router, status]);

  if (status !== "authenticated" || !isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({
  children,
  redirectTo = "/dashboard",
  fallback = defaultFallback,
}: RedirectIfAuthenticatedProps) {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router, status]);

  if (status === "loading") {
    return <>{fallback}</>;
  }

  if (isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
