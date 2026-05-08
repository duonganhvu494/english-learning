import { useEffect, useState } from "react";
import { Plus, Users, Calendar } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Modal, { ModalBody, ModalFooter } from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { classesApi, getApiErrorMessage } from "@/api";
import { resolveWorkspaceId } from "@/app/utils/workspace";
import type { ClassResponse } from "@/types";

export default function ClassesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [formData, setFormData] = useState({
    className: "",
    description: "",
  });

  const loadClasses = async (targetWorkspaceId?: string) => {
    const activeWorkspaceId = targetWorkspaceId || workspaceId;
    if (!activeWorkspaceId) {
      return;
    }
    try {
      const items = await classesApi.listWorkspaceClasses(activeWorkspaceId);
      setClasses(items);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách lớp học"));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const resolvedWorkspaceId = await resolveWorkspaceId();
        setWorkspaceIdState(resolvedWorkspaceId);
        await loadClasses(resolvedWorkspaceId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Không thể xác định workspace"));
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await classesApi.createClass(workspaceId, {
        className: formData.className,
        description: formData.description.trim() || undefined,
      });
      toast.success("Tạo lớp học thanh cong");
      await loadClasses(workspaceId);
      setShowCreateModal(false);
      setFormData({ className: "", description: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tạo lớp học"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h1>
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
          <Link key={classItem.id} to={`/admin/classes/${classItem.id}`}>
            <Card hover className="h-full">
              <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-slate-200" />
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {classItem.className}
                  </h3>
                  <Badge variant="success">Đang hoạt động</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {classItem.description || "Không có mô tả"}
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Workspace:</span>{" "}
                    {classItem.workspaceId}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{classItem.studentCount} học viên</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Session quản lý</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo lớp học moi"
      >
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <Input
              label="Ten lop hoc"
              name="className"
              placeholder="Vi du: IELTS Foundation 01"
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                placeholder="Mô tả ngắn về lớp học"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              type="button"
            >
              Huy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo lớp học"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
