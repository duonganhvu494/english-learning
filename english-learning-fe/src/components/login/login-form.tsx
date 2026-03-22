"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Eye } from "lucide-react";
import { ApiError, authApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const { dictionary } = useAppSettings();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await authApi.login({
        userName,
        password,
      });

      notifySuccess(
        translateApiMessage(
          typeof response.message === "string" ? response.message : undefined,
          undefined,
          dictionary,
          dictionary.login.defaultSuccessMessage,
        ),
      );
      setPassword("");
      router.push("/dashboard");
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        notifyError(
          translateApiMessage(
            apiError.details,
            apiError.code,
            dictionary,
            dictionary.login.defaultErrorMessage,
          ),
        );
      } else {
        notifyError(dictionary.login.defaultErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full lg:max-w-105">
      <Card
        title={dictionary.login.formTitle}
        description={dictionary.login.formDescription}
      >
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <Input
            label={dictionary.login.userNameLabel}
            icon={<User className="h-5 w-5" />}
            type="text"
            placeholder={dictionary.login.userNamePlaceholder}
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            autoComplete="username"
          />

          <Input
            label={dictionary.login.passwordLabel}
            icon={<Lock className="h-5 w-5" />}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-(--color-text-soft) transition-colors hover:text-(--color-text)"
                aria-label="Toggle password visibility"
              >
                <Eye className="h-5 w-5" />
              </button>
            }
            type={showPassword ? "text" : "password"}
            placeholder={dictionary.login.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between gap-4 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-(--color-text-muted)">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border border-(--color-border-strong) accent-(--color-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
              />
              <span className="whitespace-nowrap">
                {dictionary.login.rememberMe}
              </span>
            </label>

            <a
              href="#"
              className="text-sm font-semibold text-(--color-primary) hover:underline"
            >
              {dictionary.login.forgotPassword}
            </a>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !userName || !password}
            className="disabled:cursor-not-allowed disabled:opacity-70 sm:h-14 sm:text-base"
          >
            {isSubmitting
              ? dictionary.login.submitLoading
              : dictionary.login.submit}
          </Button>

          <div className="flex items-center gap-3 pt-1">
            <span className="h-px flex-1 bg-(--color-border)" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-text-soft)">
              {dictionary.login.or}
            </span>
            <span className="h-px flex-1 bg-(--color-border)" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 text-sm font-semibold text-(--color-text-muted) transition-colors hover:bg-(--color-surface-2) hover:text-(--color-text)"
            >
              <span className="text-red-500">G</span>
              <span>{dictionary.login.loginWithGoogle}</span>
            </button>

            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 text-sm font-semibold text-(--color-text-muted) transition-colors hover:bg-(--color-surface-2) hover:text-(--color-text)"
            >
              <span className="text-[#4267b2]">F</span>
              <span>{dictionary.login.loginWithFacebook}</span>
            </button>
          </div>

          <p className="pt-4 text-center text-sm text-(--color-text-muted) sm:text-base">
            {dictionary.login.noAccount}{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-(--color-primary) hover:underline"
            >
              {dictionary.login.signUpNow}
            </Link>
          </p>
        </form>
      </Card>
    </section>
  );
}
