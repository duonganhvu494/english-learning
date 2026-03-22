"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { User, Mail, Lock, Eye } from "lucide-react";
import { ApiError, authApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const { dictionary } = useAppSettings();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid =
    fullName.trim() &&
    userName.trim() &&
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
        userName: userName.trim(),
        email: email.trim(),
        password,
      });

      notifySuccess(dictionary.signUp.defaultSuccessMessage);

      setFullName("");
      setUserName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      // chuyển hướng qua login
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        notifyError(
          translateApiMessage(
            apiError.details,
            apiError.code,
            dictionary,
            dictionary.signUp.defaultErrorMessage,
          ),
        );
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
            icon={<User className="h-5 w-5" />}
            type="text"
            placeholder={dictionary.signUp.fullNamePlaceholder}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
          />

          <Input
            label={dictionary.signUp.userNameLabel}
            icon={<User className="h-5 w-5" />}
            type="text"
            placeholder={dictionary.signUp.userNamePlaceholder}
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            autoComplete="username"
          />

          <Input
            label={dictionary.signUp.emailLabel}
            icon={<Mail className="h-5 w-5" />}
            type="email"
            placeholder={dictionary.signUp.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <Input
            label={dictionary.signUp.passwordLabel}
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
            placeholder={dictionary.signUp.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />

          <Input
            label={dictionary.signUp.confirmPasswordLabel}
            icon={<Lock className="h-5 w-5" />}
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-(--color-text-soft) transition-colors hover:text-(--color-text)"
                aria-label="Toggle confirm password visibility"
              >
                <Eye className="h-5 w-5" />
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
