import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";

import { resolveApiUrl } from "@/api";
import { formatDateTime } from "@/app/utils/format";

import type { SubmissionResponse } from "@/types";

export interface ReviewSubmissionFormValue {
  score: string;
  feedback: string;
}

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  submission: SubmissionResponse | null;
  onClose: () => void;
  onSubmit: (value: ReviewSubmissionFormValue) => void | Promise<void>;
}

type ReviewSubmissionFormErrors = {
  score?: string;
};

const INITIAL_FORM: ReviewSubmissionFormValue = {
  score: "",
  feedback: "",
};

export default function ReviewSubmissionModal({
  isOpen,
  isSubmitting,
  submission,
  onClose,
  onSubmit,
}: ReviewSubmissionModalProps) {
  const [reviewData, setReviewData] =
    useState<ReviewSubmissionFormValue>(INITIAL_FORM);

  const [errors, setErrors] = useState<ReviewSubmissionFormErrors>({});

  useEffect(() => {
    if (isOpen && submission) {
      setReviewData({
        score: submission.score?.toString() ?? "",
        feedback: submission.feedback ?? "",
      });

      setErrors({});
      return;
    }

    if (!isOpen) {
      setReviewData(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen, submission]);

  const clearError = (field: keyof ReviewSubmissionFormErrors) => {
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
    const nextErrors: ReviewSubmissionFormErrors = {};

    const score = reviewData.score.trim();

    if (!score) {
      nextErrors.score = "Vui lòng nhập điểm";
    } else {
      const parsedScore = Number(score);

      if (!Number.isFinite(parsedScore)) {
        nextErrors.score = "Điểm không hợp lệ";
      } else if (parsedScore < 0 || parsedScore > 10) {
        nextErrors.score = "Điểm phải từ 0 đến 10";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting || !submission) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      score: reviewData.score.trim(),
      feedback: reviewData.feedback.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chấm điểm bài nộp"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          <p className="text-sm text-gray-600">
            Học viên:{" "}
            <span className="font-medium text-gray-900">
              {submission?.studentName || "Học viên"}
            </span>
          </p>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-gray-700">
                Bài làm của học viên
              </p>

              {submission?.material?.downloadUrl && (
                <a
                  href={resolveApiUrl(submission.material.downloadUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm" type="button">
                    <Download className="w-3 h-3" />
                    Tải xuống
                  </Button>
                </a>
              )}
            </div>

            <p className="text-sm text-gray-600">
              Tệp: {submission?.material?.fileName || "Không có tệp"}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Nộp lúc:{" "}
              {submission?.submittedAt
                ? formatDateTime(submission.submittedAt)
                : "-"}
            </p>
          </div>

          <Input
            label="Điểm số"
            type="number"
            name="score"
            placeholder="Nhập điểm"
            min="0"
            max="10"
            step="0.1"
            value={reviewData.score}
            error={errors.score}
            onChange={(event) => {
              setReviewData((prev) => ({
                ...prev,
                score: event.target.value,
              }));

              clearError("score");
            }}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhận xét
            </label>

            <textarea
              name="feedback"
              placeholder="Nhận xét về bài làm của học viên..."
              value={reviewData.feedback}
              onChange={(event) =>
                setReviewData((prev) => ({
                  ...prev,
                  feedback: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
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

          <Button type="submit" disabled={isSubmitting || !submission}>
            {isSubmitting ? "Đang lưu..." : "Lưu điểm"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
