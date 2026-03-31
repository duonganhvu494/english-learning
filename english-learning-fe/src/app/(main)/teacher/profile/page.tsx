"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, usersApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { useNotification } from "@/providers/notification-provider";

export default function TeacherProfilePage() {
  const { dictionary } = useAppSettings();
  const { user, workspaces, refreshUser } = useAuth();
  const toast = useNotification();
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setUserName(user?.userName ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const workspaceBadges = useMemo(
    () =>
      workspaces.map((workspace) => ({
        id: workspace.workspaceId,
        label: workspace.workspaceName,
        role: workspace.role || "-",
      })),
    [workspaces],
  );

  const isDirty =
    fullName.trim() !== (user?.fullName ?? "") ||
    userName.trim() !== (user?.userName ?? "") ||
    email.trim() !== (user?.email ?? "");

  const isSubmitDisabled =
    isSubmitting ||
    !isDirty ||
    fullName.trim().length === 0 ||
    userName.trim().length === 0 ||
    email.trim().length === 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await usersApi.updateMe({
        fullName: fullName.trim(),
        userName: userName.trim(),
        email: email.trim(),
      });
      await refreshUser();
      toast.success(
        dictionary.profilePage.updateSuccessTitle,
        dictionary.profilePage.updateSuccessMessage,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? translateApiMessage(
              error.details,
              error.code,
              dictionary,
              dictionary.profilePage.updateErrorFallback,
            )
          : dictionary.profilePage.updateErrorFallback;

      setFormError(message);
      toast.error(dictionary.profilePage.title, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName(user?.fullName ?? "");
    setUserName(user?.userName ?? "");
    setEmail(user?.email ?? "");
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-app-text">
          {dictionary.profilePage.title}
        </h1>
        <p className="mt-2 text-sm text-app-text-muted">
          {dictionary.profilePage.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-app-surface-2">
          <CardHeader>
            <CardTitle>{dictionary.profilePage.editTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label={dictionary.profilePage.fullNameLabel}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={dictionary.profilePage.fullNamePlaceholder}
              />

              <Input
                label={dictionary.profilePage.userNameLabel}
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                placeholder={dictionary.profilePage.userNamePlaceholder}
              />

              <Input
                type="email"
                label={dictionary.profilePage.emailLabel}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={dictionary.profilePage.emailPlaceholder}
              />

              {formError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-auto min-w-32"
                  onClick={handleReset}
                  disabled={isSubmitting || !isDirty}
                >
                  {dictionary.profilePage.reset}
                </Button>
                <Button
                  type="submit"
                  className="w-auto min-w-40"
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting
                    ? dictionary.profilePage.saving
                    : dictionary.profilePage.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-app-surface-2">
          <CardHeader>
            <CardTitle>{dictionary.profilePage.workspaceTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-app-text-muted">
              <span className="font-medium text-app-text">
                {dictionary.profilePage.workspaceCountLabel}:{" "}
              </span>
              {workspaceBadges.length}
            </div>

            {workspaceBadges.length === 0 ? (
              <p className="text-sm text-app-text-muted">
                {dictionary.profilePage.noWorkspace}
              </p>
            ) : (
              <div className="space-y-3">
                {workspaceBadges.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="rounded-xl border border-app-border bg-app-surface px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-app-text">
                          {workspace.label}
                        </p>
                        <p className="mt-1 text-sm text-app-text-muted">
                          {dictionary.profilePage.workspaceRoleLabel}:{" "}
                          {workspace.role}
                        </p>
                      </div>
                      <Badge variant="secondary">{workspace.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
