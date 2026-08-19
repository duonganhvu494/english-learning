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

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo buổi học mới"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <Input
            label="Chủ đề buổi học"
            name="topic"
            placeholder="Ví dụ: Kỹ năng đọc - Phần 1"
            value={formData.topic}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                topic: event.target.value,
              }))
            }
            required
          />

          <Input
            label="Thời gian bắt đầu"
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
            label="Thời gian kết thúc"
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