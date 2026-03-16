"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, authApi } from "@/api";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const { dictionary } = useAppSettings();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid =
    fullName.trim() &&
    email.trim() &&
    password.trim() &&
    password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      notifyError(dictionary.signUp.passwordMismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({
        fullName: fullName.trim(),
        userName: fullName.trim().toLowerCase().replace(/\s+/g, "_"),
        email: email.trim(),
        password,
      });

      notifySuccess(dictionary.signUp.defaultSuccessMessage);

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        notifyError(dictionary.signUp.defaultErrorMessage);
      } else {
        notifyError(dictionary.signUp.defaultErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full lg:max-w-105">
      <Card
        title={dictionary.signUp.formTitle}
        description={dictionary.signUp.formDescription}
      >
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <Input
            label={dictionary.signUp.fullNameLabel}
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <circle cx="12" cy="8" r="3" stroke="currentColor" />
                <path
                  d="M5 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
                  stroke="currentColor"
                />
              </svg>
            }
            type="text"
            placeholder={dictionary.signUp.fullNamePlaceholder}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
          />

          <Input
            label={dictionary.signUp.emailLabel}
            icon={
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
            }
            type="email"
            placeholder={dictionary.signUp.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <Input
            label={dictionary.signUp.passwordLabel}
            icon={
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
            }
            suffix={
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
            }
            type={showPassword ? "text" : "password"}
            placeholder={dictionary.signUp.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />

          <Input
            label={dictionary.signUp.confirmPasswordLabel}
            icon={
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
            }
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-(--color-text-soft) transition-colors hover:text-(--color-text)"
                aria-label="Toggle confirm password visibility"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
                    stroke="currentColor"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" />
                </svg>
              </button>
            }
            type={showConfirmPassword ? "text" : "password"}
            placeholder={dictionary.signUp.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? dictionary.signUp.submitLoading
              : dictionary.signUp.submit}
          </Button>

          <p className="pt-4 text-center text-sm text-(--color-text-muted) sm:text-base">
            {dictionary.signUp.alreadyAccount}{" "}
            <Link
              href="/login"
              className="font-semibold text-(--color-primary) hover:underline"
            >
              {dictionary.signUp.signInNow}
            </Link>
          </p>
        </form>
      </Card>
    </section>
  );
}
