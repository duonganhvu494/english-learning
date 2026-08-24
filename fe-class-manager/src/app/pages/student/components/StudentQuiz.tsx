import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileQuestion,
  Loader2,
  Play,
  Send,
  XCircle,
} from "lucide-react";
import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";
import { toast } from "sonner";

import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/app/components/ui/Card";

import { assignmentQuizApi, getApiErrorMessage, resolveApiUrl } from "@/api";

import type {
  AssignmentQuizAttemptResponse,
  AssignmentQuizResponse,
} from "@/types";

import { getQuizQuestions } from "@/types/assignment-quiz.types";
import { formatDateTime } from "@/app/utils/format";

interface StudentQuizProps {
  assignmentId: string;
  assignmentStatus: string;
}

type AnswerMap = Record<string, string>;

function getAttemptStatus(
  attempt: AssignmentQuizAttemptResponse | null,
): "not_started" | "in_progress" | "submitted" {
  if (!attempt) {
    return "not_started";
  }

  if (attempt.submittedAt || attempt.status?.toLowerCase() === "submitted") {
    return "submitted";
  }

  if (attempt.startedAt || attempt.status?.toLowerCase() === "in_progress") {
    return "in_progress";
  }

  return "not_started";
}

export default function StudentQuiz({
  assignmentId,
  assignmentStatus,
}: StudentQuizProps) {
  const [quiz, setQuiz] = useState<AssignmentQuizResponse | null>(null);

  const [attempt, setAttempt] = useState<AssignmentQuizAttemptResponse | null>(
    null,
  );

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [answers, setAnswers] = useState<AnswerMap>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const attemptStatus = getAttemptStatus(attempt);

  const questions = useMemo(() => {
    return [...getQuizQuestions(quiz)].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [quiz]);

  const answeredCount = useMemo(() => {
    return questions.filter((question) => Boolean(answers[question.id])).length;
  }, [questions, answers]);

  const loadAttempt = async () => {
    setIsLoading(true);

    try {
      const currentAttempt = await assignmentQuizApi.getMyAttempt(assignmentId);

      setAttempt(currentAttempt);

      if (getAttemptStatus(currentAttempt) === "in_progress") {
        const quizData = await assignmentQuizApi.getQuiz(assignmentId);

        setQuiz(quizData);

        const restoredAnswers: AnswerMap = {};

        for (const answer of currentAttempt.answers ?? []) {
          if (answer.questionId && answer.selectedOptionId) {
            restoredAnswers[answer.questionId] = answer.selectedOptionId;
          }
        }

        setAnswers(restoredAnswers);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải bài trắc nghiệm"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setQuiz(null);
    setAttempt(null);
    setAnswers({});

    void loadAttempt();
  }, [assignmentId]);

  const handleStart = async () => {
    if (assignmentStatus.toLowerCase() !== "open" || isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      const startedAttempt =
        await assignmentQuizApi.startMyAttempt(assignmentId);

      const quizData = await assignmentQuizApi.getQuiz(assignmentId);

      setAttempt(startedAttempt);
      setQuiz(quizData);
      setAnswers({});

      toast.success("Đã bắt đầu làm bài");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể bắt đầu bài trắc nghiệm"),
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = () => {
    if (questions.length === 0 || isSubmitting) {
      return;
    }

    if (answeredCount !== questions.length) {
      toast.error(
        `Bạn còn ${questions.length - answeredCount} câu chưa trả lời`,
      );
      return;
    }

    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await assignmentQuizApi.submitMyAttempt(assignmentId, {
        answers: questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: answers[question.id],
        })),
      });

      setAttempt(result);
      setQuiz(null);
      setShowSubmitConfirm(false);

      toast.success("Nộp bài trắc nghiệm thành công");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể nộp bài trắc nghiệm"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="py-10">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải bài trắc nghiệm...
          </div>
        </CardBody>
      </Card>
    );
  }

  if (attemptStatus === "submitted" && attempt) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Kết quả trắc nghiệm
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Bài làm đã được hệ thống chấm tự động.
              </p>
            </div>

            <Badge variant="success">Đã nộp</Badge>
          </div>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-sm text-gray-600">Điểm</p>

              <p className="text-3xl font-bold text-green-600 mt-1">
                {attempt.score ?? 0}

                {attempt.maxScore !== null && (
                  <span className="text-base font-medium">
                    {" "}
                    / {attempt.maxScore}
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-sm text-gray-600">Câu đúng</p>

              <p className="text-3xl font-bold text-blue-600 mt-1">
                {attempt.correctCount}/{attempt.totalQuestions}
              </p>
            </div>
          </div>

          {attempt.submittedAt && (
            <p className="text-sm text-gray-500 text-center">
              Nộp lúc: {formatDateTime(attempt.submittedAt)}
            </p>
          )}

          {(attempt.answers?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Chi tiết câu trả lời
              </p>

              {attempt.answers?.map((answer, index) => (
                <div
                  key={answer.questionId ?? index}
                  className="p-4 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900">
                      Câu {index + 1}
                      {answer.question?.content
                        ? `: ${answer.question.content}`
                        : ""}
                    </p>

                    {answer.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </div>

                  {answer.selectedOption?.content && (
                    <p className="text-sm text-gray-600 mt-2">
                      Bạn chọn:{" "}
                      <span className="font-medium">
                        {answer.selectedOption.content}
                      </span>
                    </p>
                  )}

                  <p
                    className={`text-sm font-medium mt-2 ${
                      answer.isCorrect ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {answer.isCorrect ? "Đúng" : "Sai"} · +
                    {answer.awardedPoints} điểm
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  if (attemptStatus === "not_started") {
    const normalizedStatus = assignmentStatus.toLowerCase();

    const canStart = normalizedStatus === "open";

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-blue-600" />

            <h3 className="font-semibold text-gray-900">Bài trắc nghiệm</h3>
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          <div
            className={`p-4 rounded-xl ${
              canStart ? "bg-blue-50" : "bg-gray-50"
            }`}
          >
            <p className="text-sm font-medium text-gray-800">
              {canStart
                ? "Bài đã mở và có thể bắt đầu"
                : normalizedStatus === "upcoming"
                  ? "Bài trắc nghiệm chưa mở"
                  : "Bài trắc nghiệm đã đóng"}
            </p>

            <p className="text-sm text-gray-600 mt-2">
              {canStart
                ? "Nhấn bắt đầu để xem câu hỏi và làm bài."
                : normalizedStatus === "upcoming"
                  ? "Bạn chưa thể làm bài trước thời gian mở."
                  : "Thời gian làm bài đã kết thúc."}
            </p>
          </div>

          <Button
            className="w-full"
            disabled={!canStart || isStarting}
            onClick={handleStart}
          >
            {isStarting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}

            {isStarting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Làm bài trắc nghiệm
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Đã trả lời {answeredCount}/{questions.length} câu
              </p>
            </div>

            <Badge variant="info">Đang làm</Badge>
          </div>
        </CardHeader>

        <CardBody className="space-y-5">
          {questions.map((question, questionIndex) => (
            <div
              key={question.id}
              className="p-5 border border-gray-200 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Câu {questionIndex + 1}
                  </p>

                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">
                    {question.content}
                  </p>
                </div>

                <span className="text-sm text-gray-500 shrink-0">
                  {question.points} điểm
                </span>
              </div>

              {question.material && (
                <a
                  href={resolveApiUrl(
                    `/assignments/${assignmentId}/quiz/questions/${question.id}/materials/${question.material.id}/download`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-4"
                >
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                    Tài liệu câu hỏi
                  </Button>
                </a>
              )}

              <div className="space-y-2 mt-4">
                {[...question.options]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((option) => {
                    const checked = answers[question.id] === option.id;

                    return (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer ${
                          checked
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={checked}
                          onChange={() =>
                            handleSelectAnswer(question.id, option.id)
                          }
                          className="mt-1"
                        />

                        <span className="text-sm text-gray-800">
                          {option.content}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          ))}

          <Button
            className="w-full"
            disabled={answeredCount !== questions.length || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}

            {isSubmitting
              ? "Đang nộp..."
              : `Nộp bài (${answeredCount}/${questions.length})`}
          </Button>
        </CardBody>
      </Card>

      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => {
          if (!isSubmitting) {
            setShowSubmitConfirm(false);
          }
        }}
        title="Xác nhận nộp bài"
      >
        <ModalBody>
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn nộp bài trắc nghiệm?
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Sau khi nộp, bạn sẽ{" "}
            <span className="font-medium text-gray-900">
              không thể chỉnh sửa câu trả lời
            </span>
            .
          </p>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setShowSubmitConfirm(false)}
          >
            Tiếp tục làm bài
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Xác nhận nộp bài
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
