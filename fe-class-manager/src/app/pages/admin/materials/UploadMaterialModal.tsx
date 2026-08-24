import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";

import type { MaterialCategory } from "@/types";

type UploadableMaterialCategory = Exclude<MaterialCategory, "submission">;

export interface UploadMaterialFormValue {
  file: File;
  title: string;
  category: UploadableMaterialCategory;
}

interface UploadMaterialModalProps {
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onSubmit: (value: UploadMaterialFormValue) => void | Promise<void>;
}

type UploadMaterialFormErrors = {
  title?: string;
  file?: string;
};

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes <= 0) {
    return "-";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(sizeInBytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function UploadMaterialModal({
  isOpen,
  isUploading,
  onClose,
  onSubmit,
}: UploadMaterialModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [title, setTitle] = useState("");

  const [category, setCategory] =
    useState<UploadableMaterialCategory>("general");

  const [errors, setErrors] = useState<UploadMaterialFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setTitle("");
      setCategory("general");
      setErrors({});
    }
  }, [isOpen]);

  const clearError = (field: keyof UploadMaterialFormErrors) => {
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
    const nextErrors: UploadMaterialFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Tiêu đề tài liệu không được để trống";
    }

    if (!selectedFile) {
      nextErrors.file = "Vui lòng chọn tệp";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    if (isUploading) {
      return;
    }

    setSelectedFile(null);
    setTitle("");
    setCategory("general");
    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!selectedFile) {
      return;
    }

    await onSubmit({
      file: selectedFile,
      title: title.trim(),
      category,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tải tài liệu mới"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          <Input
            label="Tiêu đề tài liệu"
            name="title"
            placeholder="Ví dụ: Slide bài 3"
            value={title}
            error={errors.title}
            onChange={(event) => {
              setTitle(event.target.value);

              clearError("title");
            }}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
              <span className="text-red-500 ml-1">*</span>
            </label>

            <select
              name="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as UploadableMaterialCategory)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">Tài liệu chung</option>

              <option value="lecture">Bài giảng</option>

              <option value="assignment">Bài tập</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn tệp
              <span className="text-red-500 ml-1">*</span>
            </label>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                errors.file ? "border-red-500" : "border-gray-300"
              }`}
            >
              <input
                type="file"
                id="material-file-upload"
                className="hidden"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);

                  clearError("file");
                }}
              />

              <label
                htmlFor="material-file-upload"
                className="cursor-pointer block"
              >
                <Upload
                  className={`w-10 h-10 mx-auto mb-2 ${
                    errors.file ? "text-red-400" : "text-gray-400"
                  }`}
                />

                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>

                    <p className="text-xs text-blue-600 mt-2">
                      Nhấp để chọn tệp khác
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Nhấp để chọn tệp từ máy tính
                  </p>
                )}
              </label>
            </div>

            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Hủy
          </Button>

          <Button type="submit" disabled={isUploading}>
            <Upload className="w-4 h-4" />

            {isUploading ? "Đang tải..." : "Tải lên"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
