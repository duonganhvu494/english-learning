import { useEffect, useState } from "react";
import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import type { WorkspaceStudentListItem } from "@/types";

interface AddStudentsModalProps {
  isOpen: boolean;
  students: WorkspaceStudentListItem[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (studentIds: string[]) => void | Promise<void>;
}

export default function AddStudentsModal({
  isOpen,
  students,
  isSaving,
  onClose,
  onSubmit,
}: AddStudentsModalProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedStudentIds([]);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Thêm học viên vào lớp"
      size="lg"
    >
      <ModalBody>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {students.length === 0 && (
            <div className="text-sm text-gray-500 py-6 text-center">
              Không còn học viên nào để thêm
            </div>
          )}

          {students.map((student) => {
            const isSelected = selectedStudentIds.includes(student.studentId);

            return (
              <label
                key={student.studentId}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => {
                    setSelectedStudentIds((prev) => {
                      if (event.target.checked) {
                        return [...prev, student.studentId];
                      }

                      return prev.filter(
                        (studentId) => studentId !== student.studentId,
                      );
                    });
                  }}
                  className="mt-1"
                />

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.fullName}
                  </p>
                  <p className="text-xs text-gray-600">{student.email}</p>
                </div>
              </label>
            );
          })}
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
        <Button
          onClick={() => onSubmit(selectedStudentIds)}
          disabled={selectedStudentIds.length === 0 || isSaving}
        >
          {isSaving ? "Đang thêm..." : "Thêm vào lớp"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
