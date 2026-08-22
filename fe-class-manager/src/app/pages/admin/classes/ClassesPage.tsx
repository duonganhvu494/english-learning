import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import Card, { CardBody } from "@/app/components/ui/Card";
import { classesApi, getApiErrorMessage } from "@/api";
import { resolveWorkspaceId } from "@/app/utils/workspace";
import type { ClassResponse } from "@/types";
import CreateClassModal, {
  type CreateClassFormValue,
} from "./CreateClassModal";

export default function ClassesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const loadClasses = async (targetWorkspaceId?: string) => {
    const activeWorkspaceId = targetWorkspaceId ?? workspaceId;

    if (!activeWorkspaceId) {
      return;
    }

    try {
      const items =
        await classesApi.listWorkspaceClasses(activeWorkspaceId);
      setClasses(items);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải danh sách lớp học"),
      );
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);

      try {
        const resolvedWorkspaceId = await resolveWorkspaceId();
        setWorkspaceId(resolvedWorkspaceId);
        await loadClasses(resolvedWorkspaceId);
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Không thể xác định không gian làm việc",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleCreateClass = async (formData: CreateClassFormValue) => {
    if (!workspaceId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await classesApi.createClass(workspaceId, {
        className: formData.className,
        description: formData.description.trim() || undefined,
      });

      toast.success("Tạo lớp học thành công");
      await loadClasses(workspaceId);
      setShowCreateModal(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tạo lớp học"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý lớp học
          </h1>
          <p className="text-gray-600 mt-1">
            Tạo và quản lý các lớp học của trung tâm
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!workspaceId}
        >
          <Plus className="w-4 h-4" />
          Tạo lớp học mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!isLoading && classes.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-sm text-gray-500 border rounded-lg bg-white">
            Chưa có lớp học nào
          </div>
        )}

        {classes.map((classItem) => (
          <Link
            key={classItem.id}
            to={`/admin/classes/${classItem.id}`}
          >
            <Card hover className="h-full">
              <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-slate-200" />

              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {"Tên lớp học: " + classItem.className}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {"Mô tả: " + (classItem.description || "Không có mô tả")}
                </p>

                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{classItem.studentCount} học viên</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <CreateClassModal
        isOpen={showCreateModal}
        isSubmitting={isSubmitting}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClass}
      />
    </div>
  );
}