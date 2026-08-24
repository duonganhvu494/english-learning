import { useEffect, useState } from "react";

import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";

export interface CreateClassFormValue {
  className: string;
  description: string;
}

interface CreateClassModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (value: CreateClassFormValue) => void | Promise<void>;
}

type CreateClassFormErrors = {
  className?: string;
};

const INITIAL_FORM: CreateClassFormValue = {
  className: "",
  description: "",
};

export default function CreateClassModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateClassModalProps) {
  const [formData, setFormData] = useState<CreateClassFormValue>(INITIAL_FORM);

  const [errors, setErrors] = useState<CreateClassFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const nextErrors: CreateClassFormErrors = {};

    if (!formData.className.trim()) {
      nextErrors.className = "Tên lớp học không được để trống";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setFormData(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      className: formData.className.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo lớp học mới">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          <Input
            label="Tên lớp học"
            name="className"
            placeholder="Ví dụ: IELTS Foundation 01"
            value={formData.className}
            error={errors.className}
            onChange={(event) => {
              setFormData((prev) => ({
                ...prev,
                className: event.target.value,
              }));

              if (errors.className) {
                setErrors((prev) => ({
                  ...prev,
                  className: undefined,
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
              placeholder="Mô tả ngắn về lớp học"
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
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            type="button"
            disabled={isSubmitting}
          >
            Hủy
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang tạo..." : "Tạo lớp học"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
