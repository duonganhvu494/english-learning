import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Download,
  Edit3,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import {
  assignmentQuizApi,
  assignmentsApi,
  getApiErrorMessage,
  materialsApi,
  resolveApiUrl,
} from "@/api";
import type {
  AssignmentQuizManagementResponse,
  AssignmentQuizQuestionResponse,
  AssignmentResponse,
  MaterialResponse,
} from "@/types";
import { getQuizQuestions } from "@/types/assignment-quiz.types";
import { resolveWorkspaceId } from "@/app/utils/workspace";
import QuizQuestionModal, {
  type QuizQuestionFormValue,
  type QuizQuestionOptionFormValue,
} from "@/app/pages/admin/assignments/quiz/QuizQuestionModal";

function isQuizReady(questions: AssignmentQuizQuestionResponse[]): boolean {
  if (questions.length === 0) {
    return false;
  }

  return questions.every((question) => {
    const options = question.options ?? [];

    return (
      options.length >= 2 &&
      options.filter((option) => option.isCorrect).length === 1
    );
  });
}

export default function QuizManagementPage() {
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [quiz, setQuiz] = useState<AssignmentQuizManagementResponse | null>(
    null,
  );
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<AssignmentQuizQuestionResponse | null>(null);

  const questions = useMemo(
    () => [...getQuizQuestions(quiz)].sort((a, b) => a.sortOrder - b.sortOrder),
    [quiz],
  );

  const ready = useMemo(() => isQuizReady(questions), [questions]);

  const loadData = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);

    try {
      const workspaceId = await resolveWorkspaceId();

      const [assignmentResult, quizResult, materialList] = await Promise.all([
        assignmentsApi.getAssignment(assignmentId),
        assignmentQuizApi.getManagement(assignmentId),
        materialsApi.listWorkspaceMaterials(workspaceId),
      ]);

      setAssignment(assignmentResult);
      setQuiz(quizResult);
      setMaterials(
        materialList.filter(
          (material) => String(material.status).toLowerCase() === "ready",
        ),
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải nội dung trắc nghiệm"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assignmentId]);

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  const openEditQuestion = (question: AssignmentQuizQuestionResponse) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const createOptions = async (
    questionId: string,
    options: QuizQuestionOptionFormValue[],
  ) => {
    for (const [index, option] of options.entries()) {
      await assignmentQuizApi.createOption(assignmentId!, questionId, {
        content: option.content,
        isCorrect: option.isCorrect,
        sortOrder: index,
      });
    }
  };

  const syncExistingOptions = async (
    question: AssignmentQuizQuestionResponse,
    nextOptions: QuizQuestionOptionFormValue[],
  ) => {
    const nextExistingIds = new Set(
      nextOptions
        .map((option) => option.id)
        .filter((id): id is string => Boolean(id)),
    );

    for (const existingOption of question.options ?? []) {
      if (!nextExistingIds.has(existingOption.id)) {
        await assignmentQuizApi.deleteOption(assignmentId!, existingOption.id);
      }
    }

    const indexedOptions = nextOptions.map((option, index) => ({
      option,
      sortOrder: index,
    }));

    const incorrectOptions = indexedOptions.filter(
      ({ option }) => !option.isCorrect,
    );

    for (const { option, sortOrder } of incorrectOptions) {
      if (option.id) {
        await assignmentQuizApi.updateOption(assignmentId!, option.id, {
          content: option.content,
          isCorrect: false,
          sortOrder,
        });
      } else {
        await assignmentQuizApi.createOption(assignmentId!, question.id, {
          content: option.content,
          isCorrect: false,
          sortOrder,
        });
      }
    }

    const correctEntry = indexedOptions.find(({ option }) => option.isCorrect);

    if (!correctEntry) {
      throw new Error("Quiz question must have exactly one correct option");
    }

    const { option: correctOption, sortOrder: correctSortOrder } = correctEntry;

    if (correctOption.id) {
      await assignmentQuizApi.updateOption(assignmentId!, correctOption.id, {
        content: correctOption.content,
        isCorrect: true,
        sortOrder: correctSortOrder,
      });
    } else {
      await assignmentQuizApi.createOption(assignmentId!, question.id, {
        content: correctOption.content,
        isCorrect: true,
        sortOrder: correctSortOrder,
      });
    }
  };

  const handleSaveQuestion = async (value: QuizQuestionFormValue) => {
    if (!assignmentId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (editingQuestion) {
        await assignmentQuizApi.updateQuestion(
          assignmentId,
          editingQuestion.id,
          {
            content: value.content,
            points: value.points,
            materialId: value.materialId,
          },
        );

        await syncExistingOptions(editingQuestion, value.options);

        toast.success("Đã cập nhật câu hỏi và đáp án");
      } else {
        const createdQuestion = await assignmentQuizApi.createQuestion(
          assignmentId,
          {
            content: value.content,
            points: value.points,
            materialId: value.materialId,
          },
        );

        try {
          await createOptions(createdQuestion.id, value.options);
        } catch (optionError) {
          try {
            await assignmentQuizApi.deleteQuestion(
              assignmentId,
              createdQuestion.id,
            );
          } catch {}

          throw optionError;
        }

        toast.success("Đã thêm câu hỏi và đáp án");
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingQuestion
            ? "Không thể cập nhật câu hỏi"
            : "Không thể thêm câu hỏi",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (
    question: AssignmentQuizQuestionResponse,
  ) => {
    if (!assignmentId) {
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi "${question.content}"?`)) {
      return;
    }

    try {
      await assignmentQuizApi.deleteQuestion(assignmentId, question.id);

      toast.success("Đã xóa câu hỏi");
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa câu hỏi"));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">Đang tải trắc nghiệm...</div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Không tìm thấy bài trắc nghiệm.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link to={`/admin/assignments/${assignment.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý trắc nghiệm
            </h1>

            <Badge variant={ready ? "success" : "warning"}>
              {ready ? "Sẵn sàng" : "Chưa sẵn sàng"}
            </Badge>
          </div>

          <p className="text-gray-600 mt-1">{assignment.title}</p>
        </div>

        <Link to={`/admin/assignments/${assignment.id}/quiz/attempts`}>
          <Button variant="outline">
            <ClipboardCheck className="w-4 h-4" />
            Kết quả
          </Button>
        </Link>

        <Button onClick={openCreateQuestion}>
          <Plus className="w-4 h-4" />
          Thêm câu hỏi
        </Button>
      </div>

      {!ready && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          Quiz cần ít nhất một câu hỏi. Mỗi câu phải có ít nhất 2 đáp án và đúng
          1 đáp án đúng.
        </div>
      )}

      {questions.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-sm text-gray-500">Chưa có câu hỏi nào.</p>

            <Button className="mt-4" onClick={openCreateQuestion}>
              <Plus className="w-4 h-4" />
              Thêm câu hỏi đầu tiên
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const sortedOptions = [...(question.options ?? [])].sort(
              (a, b) => a.sortOrder - b.sortOrder,
            );

            return (
              <Card key={question.id}>
                <CardHeader className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">Câu {index + 1}</Badge>
                      <Badge variant="info">{question.points} điểm</Badge>
                    </div>

                    <h3 className="font-semibold text-gray-900 mt-2 whitespace-pre-wrap">
                      {question.content}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditQuestion(question)}
                    >
                      <Edit3 className="w-4 h-4" />
                      Sửa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDeleteQuestion(question)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>

                <CardBody className="space-y-4">
                  {question.material && (
                    <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {question.material.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {question.material.fileName}
                          </p>
                        </div>
                      </div>

                      <a
                        href={resolveApiUrl(question.material.downloadUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                          Tải
                        </Button>
                      </a>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Đáp án</p>

                    {sortedOptions.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg ${
                          option.isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {String.fromCharCode(65 + optionIndex)}
                        </div>

                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                            option.isCorrect
                              ? "bg-green-600 border-green-600 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {option.isCorrect && <Check className="w-4 h-4" />}
                        </div>

                        <span className="text-sm text-gray-900">
                          {option.content}
                        </span>

                        {option.isCorrect && (
                          <Badge variant="success">Đáp án đúng</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">
                    Muốn thay đổi câu hỏi hoặc đáp án, bấm “Sửa” và chỉnh tất cả
                    trong cùng một cửa sổ.
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <QuizQuestionModal
        isOpen={showQuestionModal}
        isSaving={isSaving}
        question={editingQuestion}
        materials={materials}
        onClose={() => {
          setShowQuestionModal(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSaveQuestion}
      />
    </div>
  );
}
