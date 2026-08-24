import { useEffect, useState } from "react";

import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";

export interface AddSessionFormValue {
  topic: string;
  timeStart: string;
  timeEnd: string;
}

interface AddSessionModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (value: AddSessionFormValue) => void | Promise<void>;
}

type AddSessionFormErrors = {
  topic?: string;
  timeStart?: string;
  timeEnd?: string;
};

const INITIAL_FORM: AddSessionFormValue = {
  topic: "",
  timeStart: "",
  timeEnd: "",
};

export default function AddSessionModal({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: AddSessionModalProps) {
  const [formData, setFormData] = useState<AddSessionFormValue>(INITIAL_FORM);

  const [errors, setErrors] = useState<AddSessionFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen]);

  const clearError = (field: keyof AddSessionFormErrors) => {
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
    const nextErrors: AddSessionFormErrors = {};

    const topic = formData.topic.trim();

    if (!topic) {
      nextErrors.topic = "Chủ đề buổi học không được để trống";
    }

    if (!formData.timeStart) {
      nextErrors.timeStart = "Vui lòng chọn thời gian bắt đầu";
    }

    if (!formData.timeEnd) {
      nextErrors.timeEnd = "Vui lòng chọn thời gian kết thúc";
    }

    if (formData.timeStart) {
      const startTime = new Date(formData.timeStart);

      const now = new Date();
      now.setSeconds(0, 0);

      const earliestAllowed = new Date(now.getTime() - 60_000);

      if (startTime.getTime() < earliestAllowed.getTime()) {
        nextErrors.timeStart = "Thời gian bắt đầu không được ở quá khứ";
      }
    }

    if (formData.timeStart && formData.timeEnd) {
      const startTime = new Date(formData.timeStart);

      const endTime = new Date(formData.timeEnd);

      if (endTime.getTime() <= startTime.getTime()) {
        nextErrors.timeEnd = "Thời gian kết thúc phải sau thời gian bắt đầu";
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
      topic: formData.topic.trim(),
      timeStart: formData.timeStart,
      timeEnd: formData.timeEnd,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo buổi học mới">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          <Input
            label="Chủ đề buổi học"
            name="topic"
            placeholder="Ví dụ: Kỹ năng đọc - Phần 1"
            value={formData.topic}
            error={errors.topic}
            onChange={(event) => {
              setFormData((prev) => ({
                ...prev,
                topic: event.target.value,
              }));

              clearError("topic");
            }}
            required
          />

          <Input
            label="Thời gian bắt đầu"
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
            label="Thời gian kết thúc"
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
            {isSaving ? "Đang tạo..." : "Tạo buổi học"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
