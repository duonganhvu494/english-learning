import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";

import { getApiErrorMessage, materialsApi } from "@/api";

import { resolveWorkspaceId } from "@/app/utils/workspace";

import type { AssignmentTypeInput, MaterialResponse } from "@/types";

export interface CreateAssignmentFormValue {
  title: string;
  description: string;
  timeStart: string;
  timeEnd: string;
  type: AssignmentTypeInput;
  materialIds: string[];
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (value: CreateAssignmentFormValue) => void | Promise<void>;
}

type CreateAssignmentFormErrors = {
  title?: string;
  timeStart?: string;
  timeEnd?: string;
};

const INITIAL_FORM: CreateAssignmentFormValue = {
  title: "",
  description: "",
  timeStart: "",
  timeEnd: "",
  type: "MANUAL",
  materialIds: [],
};

export default function CreateAssignmentModal({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: CreateAssignmentModalProps) {
  const [formData, setFormData] =
    useState<CreateAssignmentFormValue>(INITIAL_FORM);

  const [errors, setErrors] = useState<CreateAssignmentFormErrors>({});

  const [materials, setMaterials] = useState<MaterialResponse[]>([]);

  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
      setMaterials([]);
      return;
    }

    const loadMaterials = async () => {
      setIsLoadingMaterials(true);

      try {
        const workspaceId = await resolveWorkspaceId();

        const items = await materialsApi.listWorkspaceMaterials(workspaceId);

        setMaterials(
          items.filter(
            (material) =>
              String(material.status).toLowerCase() === "ready" &&
              (material.category === "assignment" ||
                material.category === "general"),
          ),
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Không thể tải danh sách tài liệu"),
        );
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    void loadMaterials();
  }, [isOpen]);

  const selectedMaterialSet = useMemo(
    () => new Set(formData.materialIds),
    [formData.materialIds],
  );

  const clearError = (field: keyof CreateAssignmentFormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      return {
        ...prev,
        [field]: undefined,
      };
    });
  };

  const validateForm = () => {
    const nextErrors: CreateAssignmentFormErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Tiêu đề bài tập không được để trống";
    }

    if (!formData.timeStart) {
      nextErrors.timeStart = "Vui lòng chọn thời gian mở";
    }

    if (!formData.timeEnd) {
      nextErrors.timeEnd = "Vui lòng chọn hạn nộp";
    }

    if (formData.timeStart) {
      const startTime = new Date(formData.timeStart);

      const now = new Date();
      now.setSeconds(0, 0);

      const earliestAllowed = new Date(now.getTime() - 60_000);

      if (startTime.getTime() < earliestAllowed.getTime()) {
        nextErrors.timeStart = "Thời gian mở không được ở quá khứ";
      }
    }

    if (formData.timeStart && formData.timeEnd) {
      const startTime = new Date(formData.timeStart);

      const endTime = new Date(formData.timeEnd);

      if (endTime.getTime() <= startTime.getTime()) {
        nextErrors.timeEnd = "Hạn nộp phải sau thời gian mở";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setFormData(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
    });
  };

  const toggleMaterial = (materialId: string) => {
    setFormData((prev) => ({
      ...prev,

      materialIds: selectedMaterialSet.has(materialId)
        ? prev.materialIds.filter((id) => id !== materialId)
        : [...prev.materialIds, materialId],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo bài tập mới"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          <Input
            label="Tiêu đề bài tập"
            name="title"
            placeholder="Ví dụ: Bài tập đọc hiểu"
            value={formData.title}
            error={errors.title}
            onChange={(event) => {
              setFormData((prev) => ({
                ...prev,
                title: event.target.value,
              }));

              clearError("title");
            }}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>

            <textarea
              name="description"
              placeholder="Mô tả chi tiết bài tập"
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại bài tập
              <span className="text-red-500 ml-1">*</span>
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  type: event.target.value as AssignmentTypeInput,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MANUAL">Bài tập thường</option>

              <option value="QUIZ">Trắc nghiệm</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Thời gian mở"
              type="datetime-local"
              name="timeStart"
              value={formData.timeStart}
              error={errors.timeStart}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  timeStart: event.target.value,
                }));

                clearError("timeStart");

                clearError("timeEnd");
              }}
              required
            />

            <Input
              label="Hạn nộp"
              type="datetime-local"
              name="timeEnd"
              value={formData.timeEnd}
              error={errors.timeEnd}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  timeEnd: event.target.value,
                }));

                clearError("timeEnd");
              }}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tài liệu đính kèm
              </label>

              <span className="text-xs text-gray-500">Không bắt buộc</span>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
              {isLoadingMaterials ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Đang tải tài liệu...
                </div>
              ) : materials.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Chưa có tài liệu bài tập hoặc tài liệu chung sẵn sàng
                </div>
              ) : (
                materials.map((material) => (
                  <label
                    key={material.id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterialSet.has(material.id)}
                      onChange={() => toggleMaterial(material.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />

                    <FileText className="w-4 h-4 text-gray-500 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {material.title}
                      </p>

                      <p className="text-xs text-gray-500 truncate">
                        {material.fileName}
                      </p>
                    </div>

                    <span className="text-xs text-gray-500 shrink-0">
                      {material.category === "general" ? "Chung" : "Bài tập"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            type="button"
            disabled={isSaving}
          >
            Hủy
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang tạo..." : "Tạo bài tập"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
