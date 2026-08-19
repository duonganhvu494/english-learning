import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import Modal, {
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";
import type {
  AssignmentQuizQuestionResponse,
  MaterialResponse,
} from "@/types";

export interface QuizQuestionOptionFormValue {
  id?: string;
  content: string;
  isCorrect: boolean;
}

export interface QuizQuestionFormValue {
  content: string;
  points: number;
  materialId: string | null;
  options: QuizQuestionOptionFormValue[];
}

interface QuizQuestionModalProps {
  isOpen: boolean;
  isSaving: boolean;
  question: AssignmentQuizQuestionResponse | null;
  materials: MaterialResponse[];
  onClose: () => void;
  onSubmit: (value: QuizQuestionFormValue) => void | Promise<void>;
}

function createEmptyOption(): QuizQuestionOptionFormValue {
  return {
    content: "",
    isCorrect: false,
  };
}

function createDefaultOptions(): QuizQuestionOptionFormValue[] {
  return [
    createEmptyOption(),
    createEmptyOption(),
    createEmptyOption(),
    createEmptyOption(),
  ];
}

export default function QuizQuestionModal({
  isOpen,
  isSaving,
  question,
  materials,
  onClose,
  onSubmit,
}: QuizQuestionModalProps) {
  const [content, setContent] = useState("");
  const [points, setPoints] = useState("1");
  const [materialId, setMaterialId] = useState("");
  const [options, setOptions] =
    useState<QuizQuestionOptionFormValue[]>(
      createDefaultOptions(),
    );

  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setPoints("1");
      setMaterialId("");
      setOptions(createDefaultOptions());
      return;
    }

    setContent(question?.content ?? "");
    setPoints(String(question?.points ?? 1));
    setMaterialId(question?.material?.id ?? "");

    if (question?.options?.length) {
      const sorted = [...question.options]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({
          id: option.id,
          content: option.content,
          isCorrect: option.isCorrect,
        }));

      setOptions(
        sorted.length >= 2
          ? sorted
          : [...sorted, createEmptyOption()],
      );
    } else {
      setOptions(createDefaultOptions());
    }
  }, [isOpen, question]);

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const updateOptionContent = (
    index: number,
    value: string,
  ) => {
    setOptions((prev) =>
      prev.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, content: value }
          : option,
      ),
    );
  };

  const chooseCorrectOption = (index: number) => {
    setOptions((prev) =>
      prev.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    );
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Mỗi câu hỏi cần ít nhất 2 đáp án");
      return;
    }

    setOptions((prev) =>
      prev.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    const normalizedContent = content.trim();
    const normalizedOptions = options
      .map((option) => ({
        ...option,
        content: option.content.trim(),
      }))
      .filter((option) => option.content.length > 0);

    if (!normalizedContent) {
      toast.error("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    if (normalizedOptions.length < 2) {
      toast.error("Mỗi câu hỏi cần ít nhất 2 đáp án");
      return;
    }

    const correctOptions = normalizedOptions.filter(
      (option) => option.isCorrect,
    );

    if (correctOptions.length !== 1) {
      toast.error("Vui lòng chọn đúng 1 đáp án đúng");
      return;
    }

    const parsedPoints = Number(points);

    if (
      !Number.isFinite(parsedPoints) ||
      parsedPoints < 0
    ) {
      toast.error("Điểm câu hỏi không hợp lệ");
      return;
    }

    await onSubmit({
      content: normalizedContent,
      points: parsedPoints,
      materialId: materialId || null,
      options: normalizedOptions,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={question ? "Sửa câu hỏi" : "Thêm câu hỏi"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung câu hỏi
            </label>
            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Điểm"
              type="number"
              min="0"
              step="0.5"
              value={points}
              onChange={(event) =>
                setPoints(event.target.value)
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tài liệu đính kèm
              </label>
              <select
                value={materialId}
                onChange={(event) =>
                  setMaterialId(event.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Không đính kèm</option>
                {materials.map((material) => (
                  <option
                    key={material.id}
                    value={material.id}
                  >
                    {material.title} - {material.fileName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Đáp án
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Chọn vòng tròn bên trái để đánh dấu đáp án đúng.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setOptions((prev) => [
                    ...prev,
                    createEmptyOption(),
                  ])
                }
              >
                <Plus className="w-4 h-4" />
                Thêm đáp án
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div
                  key={option.id ?? `new-${index}`}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                    option.isCorrect
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={option.isCorrect}
                    onChange={() =>
                      chooseCorrectOption(index)
                    }
                    className="shrink-0"
                    aria-label={`Chọn đáp án ${index + 1} là đáp án đúng`}
                  />

                  <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold shrink-0">
                    {String.fromCharCode(65 + index)}
                  </div>

                  <input
                    type="text"
                    value={option.content}
                    onChange={(event) =>
                      updateOptionContent(
                        index,
                        event.target.value,
                      )
                    }
                    placeholder={`Nhập đáp án ${String.fromCharCode(
                      65 + index,
                    )}`}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Xóa đáp án"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
              : question
                ? "Lưu câu hỏi"
                : "Thêm câu hỏi"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}