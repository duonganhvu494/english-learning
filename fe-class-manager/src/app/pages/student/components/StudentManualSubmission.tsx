import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/app/components/ui/Card";

import { getApiErrorMessage, resolveApiUrl, submissionsApi } from "@/api";

import type { MaterialUploadInitResponse, SubmissionResponse } from "@/types";

import { formatDateTime } from "@/app/utils/format";

interface StudentManualSubmissionProps {
  assignmentId: string;
  assignmentStatus: string;
  submission: SubmissionResponse | null;
  onUploaded: () => Promise<void> | void;
}

export default function StudentManualSubmission({
  assignmentId,
  assignmentStatus,
  submission,
  onUploaded,
}: StudentManualSubmissionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [progress, setProgress] = useState(0);

  const submitted = Boolean(submission?.submitted);

  const isOpen = assignmentStatus.toLowerCase() === "open";

  const canSubmit = isOpen && !submitted;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setProgress(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile || !canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    let uploadSession: MaterialUploadInitResponse | null = null;

    try {
      uploadSession = await submissionsApi.initMyUpload(assignmentId, {
        fileName: selectedFile.name,

        mimeType: selectedFile.type || "application/octet-stream",

        size: selectedFile.size,
      });

      const uploadedParts: Array<{
        partNumber: number;
        etag: string;
      }> = [];

      for (
        let partNumber = 1;
        partNumber <= uploadSession.totalParts;
        partNumber += 1
      ) {
        const start = (partNumber - 1) * uploadSession.partSize;

        const end = Math.min(start + uploadSession.partSize, selectedFile.size);

        const blob = selectedFile.slice(start, end);

        const signed = await submissionsApi.signMyUploadPart(assignmentId, {
          materialId: uploadSession.materialId,

          uploadSessionId: uploadSession.uploadSessionId,

          uploadId: uploadSession.uploadId,

          objectKey: uploadSession.objectKey,

          partNumber,
        });

        const uploadResult = await fetch(signed.url, {
          method: "PUT",

          headers: {
            "Content-Type": selectedFile.type || "application/octet-stream",
          },

          body: blob,
        });

        if (!uploadResult.ok) {
          throw new Error(
            `Không thể tải phần ${partNumber} lên máy chủ (${uploadResult.status})`,
          );
        }
        const etag =
          uploadResult.headers.get("etag") ?? uploadResult.headers.get("ETag");

        if (!etag) {
          throw new Error(
            `Không nhận được thông tin xác nhận của phần ${partNumber}`,
          );
        }

        uploadedParts.push({
          partNumber,
          etag,
        });
        setProgress(Math.round((partNumber / uploadSession.totalParts) * 100));
      }

      await submissionsApi.completeMyUpload(assignmentId, {
        materialId: uploadSession.materialId,

        uploadSessionId: uploadSession.uploadSessionId,

        uploadId: uploadSession.uploadId,

        objectKey: uploadSession.objectKey,

        parts: uploadedParts,
      });

      toast.success("Nộp bài thành công");

      setSelectedFile(null);
      setProgress(100);

      await onUploaded();
    } catch (error) {
      if (uploadSession) {
        try {
          await submissionsApi.abortMyUpload(assignmentId, {
            materialId: uploadSession.materialId,

            uploadSessionId: uploadSession.uploadSessionId,

            uploadId: uploadSession.uploadId,

            objectKey: uploadSession.objectKey,
          });
        } catch {}
      }

      toast.error(getApiErrorMessage(error, "Không thể nộp bài"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Bài làm của tôi</h3>
      </CardHeader>

      <CardBody>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isOpen && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  {assignmentStatus.toLowerCase() === "upcoming"
                    ? "Bài tập chưa đến thời gian mở."
                    : "Bài tập đã hết thời gian nộp."}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="submission-file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tệp bài làm
              </label>

              <label
                htmlFor="submission-file"
                className={`block border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  canSubmit
                    ? "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                }`}
              >
                <input
                  id="submission-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={!canSubmit || isSubmitting}
                />

                <Upload className="w-8 h-8 text-gray-400 mx-auto" />

                <p className="text-sm font-medium text-gray-700 mt-3 break-all">
                  {selectedFile ? selectedFile.name : "Nhấn để chọn tệp"}
                </p>

                <p className="text-xs text-gray-500 mt-1">PDF, DOC hoặc DOCX</p>

                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </label>
            </div>

            {isSubmitting && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Đang tải bài lên</span>

                  <span>{progress}%</span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedFile || !canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}

              {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />

                <p className="font-medium text-green-900">Đã nộp bài</p>
              </div>

              {submission?.submittedAt && (
                <p className="text-sm text-green-700 mt-3">
                  Nộp lúc: {formatDateTime(submission.submittedAt)}
                </p>
              )}

              {submission?.material?.fileName && (
                <p className="text-sm text-green-700 mt-1 break-all">
                  Tệp: {submission.material.fileName}
                </p>
              )}
            </div>

            {submission?.material?.downloadUrl && (
              <a
                href={resolveApiUrl(submission.material.downloadUrl)}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4" />
                  Xem bài đã nộp
                </Button>
              </a>
            )}

            {submission?.score === null && (
              <p className="text-sm text-gray-500 text-center">
                Bài làm đang chờ giáo viên chấm.
              </p>
            )}

            {submission?.score !== null && submission?.score !== undefined && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-gray-600">Điểm</p>

                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {submission.score}
                </p>

                {submission.feedback && (
                  <div className="mt-3 pt-3 border-t border-blue-100">
                    <p className="text-sm font-medium text-gray-700">
                      Nhận xét
                    </p>

                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
