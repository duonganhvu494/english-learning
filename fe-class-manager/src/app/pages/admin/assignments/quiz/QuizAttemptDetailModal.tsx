import { CheckCircle2, XCircle } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import Badge from "@/app/components/ui/Badge";

import { formatDateTime } from "@/app/utils/format";

import type { AssignmentQuizAttemptResponse } from "@/types";

interface QuizAttemptDetailModalProps {
  isOpen: boolean;
  attempt: AssignmentQuizAttemptResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function QuizAttemptDetailModal({
  isOpen,
  attempt,
  isLoading,
  onClose,
}: QuizAttemptDetailModalProps) {
  const displayName =
    attempt?.studentName ||
    attempt?.studentEmail ||
    "Không có thông tin học viên";

  const handleClose = () => {
    if (isLoading) {
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chi tiết bài làm"
      size="lg"
    >
      <ModalBody className="space-y-5">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Đang tải chi tiết...
          </div>
        ) : !attempt ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Không có dữ liệu bài làm.
          </div>
        ) : (
          <>
            <div>
              <p className="font-semibold text-gray-900">{displayName}</p>

              {attempt.studentName && attempt.studentEmail && (
                <p className="text-sm text-gray-500 mt-1">
                  {attempt.studentEmail}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Bắt đầu</p>

                <p className="text-sm font-medium text-gray-900 mt-1">
                  {attempt.startedAt ? formatDateTime(attempt.startedAt) : "-"}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Nộp bài</p>

                <p className="text-sm font-medium text-gray-900 mt-1">
                  {attempt.submittedAt
                    ? formatDateTime(attempt.submittedAt)
                    : "-"}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Kết quả</p>

                <p className="text-sm font-semibold text-blue-600 mt-1">
                  {attempt.score !== null && attempt.maxScore !== null
                    ? `${attempt.score}/${attempt.maxScore}`
                    : "-"}
                </p>
              </div>
            </div>

            {attempt.answers?.length ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Câu trả lời</h4>

                {attempt.answers.map((answer, index) => (
                  <div
                    key={
                      answer.questionId ??
                      `${answer.selectedOptionId ?? "answer"}-${index}`
                    }
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Câu {index + 1}</p>

                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {answer.question?.content ||
                            "Không có nội dung câu hỏi"}
                        </p>
                      </div>

                      <Badge variant={answer.isCorrect ? "success" : "danger"}>
                        {answer.isCorrect ? "Đúng" : "Sai"}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2 mt-3">
                      {answer.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      )}

                      <span className="text-sm text-gray-700">
                        Đã chọn:{" "}
                        <span className="font-medium">
                          {answer.selectedOption?.content || "Không xác định"}
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Điểm nhận được:{" "}
                      <span className="font-medium text-gray-700">
                        {answer.awardedPoints}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Chưa có dữ liệu câu trả lời chi tiết.
              </div>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
        >
          Đóng
        </Button>
      </ModalFooter>
    </Modal>
  );
}
