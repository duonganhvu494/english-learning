import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";
import type { MaterialCategory } from "@/types";

export interface UploadMaterialFormValue {
  file: File;
  title: string;
  category: MaterialCategory;
}

interface UploadMaterialModalProps {
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onSubmit: (value: UploadMaterialFormValue) => void | Promise<void>;
}

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
  const [category, setCategory] = useState<MaterialCategory>("general");

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setTitle("");
      setCategory("general");
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isUploading) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      return;
    }

    await onSubmit({
      file: selectedFile,
      title,
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
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <Input
            label="Tiêu đề tài liệu"
            placeholder="Ví dụ: Slide bài 3"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as MaterialCategory)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">Tài liệu chung</option>
              <option value="lecture">Bài giảng</option>
              <option value="assignment">Bài tập</option>
              <option value="submission">Bài nộp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn tệp
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="material-file-upload"
                className="hidden"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />

              <label
                htmlFor="material-file-upload"
                className="cursor-pointer"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />

                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Nhấp để chọn tệp từ máy tính
                  </p>
                )}
              </label>
            </div>
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

          <Button
            type="submit"
            disabled={!selectedFile || isUploading}
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Đang tải..." : "Tải lên"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}