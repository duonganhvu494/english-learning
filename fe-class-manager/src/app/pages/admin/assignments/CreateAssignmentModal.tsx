import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Modal, {
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";
import { materialsApi } from "@/api";
import type {
  AssignmentTypeInput,
  MaterialResponse,
} from "@/types";
import { resolveWorkspaceId } from "@/app/utils/workspace";
import { getApiErrorMessage } from "@/api";
import { toast } from "sonner";

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
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      return;
    }

    const loadMaterials = async () => {
      setIsLoadingMaterials(true);

      try {
        const workspaceId = await resolveWorkspaceId();
        const items =
          await materialsApi.listWorkspaceMaterials(workspaceId);

        setMaterials(
          items.filter(
            (material) =>
              String(material.status).toLowerCase() === "ready",
          ),
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Không thể tải danh sách tài liệu",
          ),
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

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
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
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <Input
            label="Tiêu đề bài tập"
            name="title"
            placeholder="Ví dụ: Bài tập đọc hiểu"
            value={formData.title}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại bài tập
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  timeStart: event.target.value,
                }))
              }
              required
            />

            <Input
              label="Hạn nộp"
              type="datetime-local"
              name="timeEnd"
              value={formData.timeEnd}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  timeEnd: event.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tài liệu đính kèm
              </label>
              <span className="text-xs text-gray-500">
                Không bắt buộc
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
              {isLoadingMaterials ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Đang tải tài liệu...
                </div>
              ) : materials.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Chưa có tài liệu sẵn sàng trong thư viện
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
                    />

                    <FileText className="w-4 h-4 text-gray-500 shrink-0" />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {material.fileName}
                      </p>
                    </div>
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