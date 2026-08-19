import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";
import { resolveApiUrl } from "@/api";
import type { SubmissionResponse } from "@/types";
import { formatDateTime } from "@/app/utils/format";

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

export default function ReviewSubmissionModal({
  isOpen,
  isSubmitting,
  submission,
  onClose,
  onSubmit,
}: ReviewSubmissionModalProps) {
  const [reviewData, setReviewData] = useState<ReviewSubmissionFormValue>({
    score: "",
    feedback: "",
  });

  useEffect(() => {
    if (isOpen && submission) {
      setReviewData({
        score: submission.score?.toString() ?? "",
        feedback: submission.feedback ?? "",
      });
      return;
    }

    if (!isOpen) {
      setReviewData({
        score: "",
        feedback: "",
      });
    }
  }, [isOpen, submission]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(reviewData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chấm điểm bài nộp"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
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
            onChange={(event) =>
              setReviewData((prev) => ({
                ...prev,
                score: event.target.value,
              }))
            }
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu điểm"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}