"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, classesApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useSubscription } from "@/context/subscriptionContext";
import { UpgradePlanDialog } from "@/components/common/upgrade-plan-dialog";
import { ClassesEmptyState } from "@/components/teacher/classes/classes-empty-state";
import { ClassesGrid } from "@/components/teacher/classes/classes-grid";
import { ClassFormDialog } from "@/components/teacher/classes/class-form-dialog";
import {
  EMPTY_CLASS_FORM,
  mapWorkspaceClassToClassItem,
  type ClassFormData,
  type ClassItem,
  type ClassMetadata,
} from "@/components/teacher/classes/types";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { useNotification } from "@/providers/notification-provider";
import type { WorkspaceClass } from "@/types/class";

type ClassMetadataMap = Record<string, ClassMetadata>;
const MAX_CLASSES_REACHED_CODE = "WORKSPACE_PLAN_MAX_CLASSES_REACHED";

function parseClassLimitFromError(
  details: string | string[] | undefined,
): number | null {
  if (typeof details !== "string") {
    return null;
  }

  const matched = details.match(/\bup to\s+(\d+)\s+classes\b/i);
  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[1] ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export default function ClassesPage() {
  const { dictionary } = useAppSettings();
  const { activeWorkspaceId } = useAuth();
  const { maxClasses, upgradeTier } = useSubscription();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const classesDictionary = dictionary.classesPage;

  const [workspaceClasses, setWorkspaceClasses] = useState<WorkspaceClass[]>(
    [],
  );
  const [classMetaMap, setClassMetaMap] = useState<ClassMetadataMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(EMPTY_CLASS_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const loadClasses = useCallback(async () => {
    if (!activeWorkspaceId) {
      setWorkspaceClasses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await classesApi.listClasses(activeWorkspaceId);
      setWorkspaceClasses(response.result);
    } catch (error) {
      setWorkspaceClasses([]);
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classesDictionary.loadClassesError,
          ),
        );
      } else {
        notifyError(classesDictionary.loadClassesError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    activeWorkspaceId,
    classesDictionary.loadClassesError,
    dictionary,
    notifyError,
  ]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const classList = useMemo<ClassItem[]>(
    () =>
      workspaceClasses.map((item, index) =>
        mapWorkspaceClassToClassItem(item, index, classMetaMap[item.id]),
      ),
    [classMetaMap, workspaceClasses],
  );

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingClass(null);
      setFormData(EMPTY_CLASS_FORM);
    }
  };

  const handleEdit = (classItem: ClassItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.className,
      description: classItem.description ?? "",
      schedule: classItem.schedule,
      level: classItem.level,
      status: classItem.status,
      color: classItem.color,
    });
    setDialogOpen(true);
  };

  const handleOpenUpgradeDialog = (limit: number) => {
    notifyError(
      dictionary.dashboard.upgradeAlert.replace("{maxClasses}", String(limit)),
    );
    setUpgradeDialogOpen(true);
  };

  const handleUpgrade = (tier: "pro" | "enterprise") => {
    upgradeTier(tier);
    window.location.assign("/#pricing");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeWorkspaceId) {
      notifyError(dictionary.dashboard.workspaceNotFound);
      return;
    }

    const metadata: ClassMetadata = {
      schedule: formData.schedule,
      level: formData.level,
      status: formData.status,
      color: formData.color,
    };

    if (
      !editingClass &&
      Number.isFinite(maxClasses) &&
      workspaceClasses.length >= maxClasses
    ) {
      handleOpenUpgradeDialog(maxClasses);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClass) {
        await classesApi.updateClass(editingClass.id, {
          className: formData.name,
          description: formData.description || undefined,
        });

        setClassMetaMap((prev) => ({
          ...prev,
          [editingClass.id]: metadata,
        }));
        notifySuccess(classesDictionary.classUpdatedSuccess);
      } else {
        const response = await classesApi.createClass(activeWorkspaceId, {
          className: formData.name,
          description: formData.description || undefined,
        });

        setClassMetaMap((prev) => ({
          ...prev,
          [response.result.id]: metadata,
        }));
        notifySuccess(classesDictionary.classCreatedSuccess);
      }

      await loadClasses();
      handleDialogOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === MAX_CLASSES_REACHED_CODE) {
          const parsedLimit = parseClassLimitFromError(error.details);
          const effectiveLimit =
            parsedLimit ?? (Number.isFinite(maxClasses) ? maxClasses : 3);
          handleOpenUpgradeDialog(effectiveLimit);
          return;
        }

        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classesDictionary.defaultErrorMessage,
          ),
        );
      } else {
        notifyError(classesDictionary.defaultErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!window.confirm(classesDictionary.deleteConfirm)) {
      return;
    }

    setDeletingId(classId);
    try {
      await classesApi.deleteClass(classId);
      setClassMetaMap((prev) => {
        const next = { ...prev };
        delete next[classId];
        return next;
      });
      notifySuccess(classesDictionary.classDeletedSuccess);
      await loadClasses();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classesDictionary.defaultErrorMessage,
          ),
        );
      } else {
        notifyError(classesDictionary.defaultErrorMessage);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {classesDictionary.title}
          </h1>
          <p className="text-app-text-muted">{classesDictionary.description}</p>
        </div>

        <ClassFormDialog
          open={dialogOpen}
          editingClass={editingClass}
          formData={formData}
          isSubmitting={isSubmitting}
          dictionary={classesDictionary}
          onOpenChange={handleDialogOpenChange}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-app-border bg-app-surface px-6 py-16 text-center">
          <p className="text-app-text-muted">
            {classesDictionary.loadingClasses}
          </p>
        </div>
      ) : classList.length > 0 ? (
        <ClassesGrid
          classes={classList}
          deletingId={deletingId}
          dictionary={classesDictionary}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <ClassesEmptyState
          dictionary={classesDictionary}
          onCreateFirstClass={() => setDialogOpen(true)}
        />
      )}

      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        onUpgrade={handleUpgrade}
        maxClasses={Number.isFinite(maxClasses) ? maxClasses : 999}
      />
    </div>
  );
}
