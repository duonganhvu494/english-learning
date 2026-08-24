import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";

import type { LectureResponse, MaterialResponse } from "@/types";

export interface LectureFormValue {
  title: string;
  description: string;
  materialIds: string[];
}

interface LectureModalProps {
  isOpen: boolean;
  isSaving: boolean;
  materials: MaterialResponse[];
  lecture?: LectureResponse | null;
  onClose: () => void;
  onSubmit: (value: LectureFormValue) => void | Promise<void>;
}

type LectureFormErrors = {
  title?: string;
};

export default function LectureModal({
  isOpen,
  isSaving,
  materials,
  lecture,
  onClose,
  onSubmit,
}: LectureModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<LectureFormErrors>({});

  const selectableMaterials = useMemo(
    () =>
      materials.filter(
        (material) =>
          material.category === "lecture" || material.category === "general",
      ),
    [materials],
  );

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setSelectedMaterialIds([]);
      setErrors({});
      return;
    }

    setErrors({});

    if (lecture) {
      setTitle(lecture.title);
      setDescription(lecture.description ?? "");
      setSelectedMaterialIds(lecture.materials.map((material) => material.id));
      return;
    }

    setTitle("");
    setDescription("");
    setSelectedMaterialIds([]);
  }, [isOpen, lecture]);

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId],
    );
  };

  const validateForm = () => {
    const nextErrors: LectureFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Tiêu đề bài giảng không được để trống";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
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
      title: title.trim(),
      description: description.trim(),
      materialIds: selectedMaterialIds,
    });
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={lecture ? "Chỉnh sửa bài giảng" : "Thêm bài giảng"}
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-5">
          <Input
            label="Tiêu đề bài giảng"
            name="title"
            placeholder="Ví dụ: Present Simple"
            value={title}
            error={errors.title}
            onChange={(event) => {
              setTitle(event.target.value);

              if (errors.title) {
                setErrors((prev) => ({
                  ...prev,
                  title: undefined,
                }));
              }
            }}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>

            <textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Mô tả nội dung bài giảng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700">Tài liệu</p>

              <p className="text-xs text-gray-500 mt-1">
                Chọn tài liệu chung hoặc tài liệu bài giảng từ kho tài liệu
              </p>
            </div>

            {selectableMaterials.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg py-8 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />

                <p className="text-sm text-gray-500 mt-2">
                  Chưa có tài liệu phù hợp
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Hãy tải tài liệu chung hoặc tài liệu bài giảng trước
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {selectableMaterials.map((material) => {
                  const checked = selectedMaterialIds.includes(material.id);

                  return (
                    <label
                      key={material.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMaterial(material.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />

                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {material.title}
                        </p>

                        <p className="text-xs text-gray-500 truncate">
                          {material.fileName}
                        </p>
                      </div>

                      <span className="text-xs text-gray-500">
                        {material.category === "general"
                          ? "Chung"
                          : "Bài giảng"}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Hủy
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? "Đang lưu..."
              : lecture
                ? "Lưu thay đổi"
                : "Thêm bài giảng"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
