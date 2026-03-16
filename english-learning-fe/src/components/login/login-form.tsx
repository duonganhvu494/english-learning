"use client";

import { useState, type FormEvent } from "react";
import { ApiError, authApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";

function InputIcon({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-(--color-text-soft)">
      {children}
    </span>
  );
}

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-(--color-text)">
        {label}
      </label>
      {children}
    </div>
  );
}

function InputWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 transition-colors focus-within:border-(--color-primary) focus-within:ring-4 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]">
      {children}
    </div>
  );
}

export function LoginForm() {
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
          dictionary,
          dictionary.login.defaultSuccessMessage,
        ),
      );
      setPassword("");
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        notifyError(
          translateApiMessage(
            apiError.details,
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
      <div className="rounded-[28px] border border-(--color-border) bg-(--color-surface) p-6 shadow-lg sm:p-8">
        {/* <div className="inline-flex rounded-full bg-(--color-primary-soft) px-3 py-1 text-xs font-semibold text-(--color-primary)">
          {dictionary.login.formBadge}
        </div> */}

        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-(--color-text) sm:text-4xl text-center">
          {dictionary.login.formTitle}
        </h2>

        <p className="mt-3 text-sm leading-6 text-(--color-text-muted) sm:text-base">
          {dictionary.login.formDescription}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <Field label={dictionary.login.emailLabel}>
            <InputWrapper>
              <InputIcon>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="4"
                    stroke="currentColor"
                  />
                  <path d="M4 7l8 6 8-6" stroke="currentColor" />
                </svg>
              </InputIcon>
              <input
                type="text"
                placeholder={dictionary.login.emailPlaceholder}
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                autoComplete="username"
                className="h-full w-full border-none bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-text-soft) sm:text-base"
              />
            </InputWrapper>
          </Field>

          <Field label={dictionary.login.passwordLabel}>
            <InputWrapper>
              <InputIcon>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="3"
                    stroke="currentColor"
                  />
                  <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" />
                </svg>
              </InputIcon>

              <input
                type={showPassword ? "text" : "password"}
                placeholder={dictionary.login.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-full w-full border-none bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-text-soft) sm:text-base"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-(--color-text-soft) transition-colors hover:text-(--color-text)"
                aria-label="Toggle password visibility"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
                    stroke="currentColor"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" />
                </svg>
              </button>
            </InputWrapper>
          </Field>

          <div className="flex items-center justify-between gap-4 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-(--color-text-muted)">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-(--color-border-strong) accent-(--color-primary)"
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

          <button
            type="submit"
            disabled={isSubmitting || !userName || !password}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-(--color-primary) px-4 text-sm font-bold uppercase tracking-[0.08em] text-(--color-text-inverse) transition-colors hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-70 sm:h-14 sm:text-base"
          >
            {isSubmitting
              ? dictionary.login.submitLoading
              : dictionary.login.submit}
          </button>

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
            <a
              href="#"
              className="font-semibold text-(--color-primary) hover:underline"
            >
              {dictionary.login.signUpNow}
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
