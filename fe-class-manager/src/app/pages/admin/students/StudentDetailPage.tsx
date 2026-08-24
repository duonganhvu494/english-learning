import { useEffect, useState } from "react";

import { Link, useParams } from "react-router";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  FileText,
  GraduationCap,
  Mail,
  User,
} from "lucide-react";

import { toast } from "sonner";

import Button from "@/app/components/ui/Button";

import Card, { CardBody, CardHeader } from "@/app/components/ui/Card";

import Badge from "@/app/components/ui/Badge";

import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";

import { getApiErrorMessage, workspacesApi } from "@/api";

import { resolveWorkspaceId } from "@/app/utils/workspace";

import { formatDateTime } from "@/app/utils/format";

import type {
  StudentDetailResponse,
  StudentLearningResult,
  StudentLearningResultStatus,
} from "@/types";

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "Hoạt động";

    case "inactive":
      return "Không hoạt động";

    default:
      return status;
  }
}

function getLearningStatusLabel(status: StudentLearningResultStatus): string {
  switch (status) {
    case "not_submitted":
      return "Chưa làm";

    case "in_progress":
      return "Đang làm";

    case "submitted":
      return "Đã nộp";

    case "graded":
      return "Đã chấm";

    case "completed":
      return "Hoàn thành";
  }
}

function getLearningStatusVariant(
  status: StudentLearningResultStatus,
): "default" | "warning" | "success" | "info" {
  switch (status) {
    case "not_submitted":
      return "default";

    case "in_progress":
      return "warning";

    case "submitted":
      return "info";

    case "graded":
    case "completed":
      return "success";
  }
}

function formatScore(result: StudentLearningResult): string {
  if (result.score === null) {
    return "-";
  }

  if (result.maxScore !== null && result.maxScore > 0) {
    return `${result.score}/${result.maxScore}`;
  }

  return String(result.score);
}

export default function StudentDetailPage() {
  const { studentId } = useParams();

  const [detail, setDetail] = useState<StudentDetailResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!studentId) {
      return;
    }

    setIsLoading(true);

    try {
      const workspaceId = await resolveWorkspaceId();

      const result = await workspacesApi.getWorkspaceStudentDetail(
        workspaceId,
        studentId,
      );

      setDetail(result);
    } catch (error) {
      setDetail(null);

      toast.error(
        getApiErrorMessage(error, "Không thể tải thông tin học viên"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="py-16 text-center text-sm text-gray-500">
          Đang tải thông tin học viên...
        </div>
      </div>
    );
  }

  if (!detail || !studentId) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="py-14 text-center">
            <User className="w-10 h-10 text-gray-300 mx-auto" />

            <h3 className="font-medium text-gray-900 mt-3">
              Không tìm thấy học viên
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Học viên không tồn tại hoặc không còn thuộc workspace.
            </p>

            <Link to="/admin/students" className="inline-block mt-5">
              <Button variant="outline">Quay lại danh sách</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { student, classes, summary, results } = detail;

  const statusLabel = getStatusLabel(student.status);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link to="/admin/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.fullName}
            </h1>

            <Badge
              variant={student.status === "active" ? "success" : "warning"}
            >
              {statusLabel}
            </Badge>
          </div>

          <p className="text-gray-600 mt-1">
            Tổng quan quá trình học tập và kết quả của học viên
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Lớp đang tham gia</p>

            <div className="flex items-center gap-2 mt-1">
              <GraduationCap className="w-5 h-5 text-blue-600" />

              <p className="text-2xl font-bold text-gray-900">
                {summary.classCount}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Bài đã hoàn thành</p>

            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />

              <p className="text-2xl font-bold text-gray-900">
                {summary.completedAssignmentCount}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">TB bài tập</p>

            <div className="flex items-center gap-2 mt-1">
              <ClipboardList className="w-5 h-5 text-orange-600" />

              <p className="text-2xl font-bold text-gray-900">
                {summary.manualAverageScore !== null
                  ? summary.manualAverageScore
                  : "-"}
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Bài tập nộp tệp đã chấm
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">TB trắc nghiệm</p>

            <div className="flex items-center gap-2 mt-1">
              <FileQuestion className="w-5 h-5 text-purple-600" />

              <p className="text-2xl font-bold text-gray-900">
                {summary.quizAveragePercentage !== null
                  ? `${summary.quizAveragePercentage}%`
                  : "-"}
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Trung bình quiz đã hoàn thành
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold text-gray-900">Thông tin học viên</h3>

            <p className="text-sm text-gray-500 mt-1">
              Thông tin tài khoản trong workspace
            </p>
          </div>
        </CardHeader>

        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Họ và tên</p>

              <div className="flex items-center gap-2 mt-2">
                <User className="w-4 h-4 text-gray-400" />

                <p className="font-medium text-gray-900">{student.fullName}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>

              <div className="flex items-center gap-2 mt-2">
                <Mail className="w-4 h-4 text-gray-400" />

                <p className="font-medium text-gray-900 break-all">
                  {student.email}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Username</p>

              <div className="flex items-center gap-2 mt-2">
                <User className="w-4 h-4 text-gray-400" />

                <p className="font-medium text-gray-900">{student.userName}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Vai trò</p>

              <div className="mt-2">
                <Badge variant="default">{student.role}</Badge>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold text-gray-900">Lớp đang tham gia</h3>

            <p className="text-sm text-gray-500 mt-1">
              {classes.length} lớp học
            </p>
          </div>
        </CardHeader>

        <CardBody>
          {classes.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />

              <p className="text-sm text-gray-500 mt-3">
                Học viên chưa được thêm vào lớp nào
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp học</TableHead>

                  <TableHead>Mô tả</TableHead>

                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <Link
                        to={`/admin/classes/${classItem.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>

                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">
                            {classItem.className}
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Đang tham gia
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-xl line-clamp-2">
                        {classItem.description || "Chưa có mô tả"}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end">
                        <Link to={`/admin/classes/${classItem.id}`}>
                          <Button variant="outline" size="sm">
                            Xem lớp
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold text-gray-900">Kết quả học tập</h3>

            <p className="text-sm text-gray-500 mt-1">
              Kết quả bài tập và trắc nghiệm của học viên
            </p>
          </div>
        </CardHeader>

        <CardBody>
          {results.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />

              <p className="text-sm text-gray-500 mt-3">
                Chưa có bài tập hoặc kết quả học tập
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bài tập</TableHead>

                  <TableHead>Lớp</TableHead>

                  <TableHead>Loại</TableHead>

                  <TableHead>Điểm</TableHead>

                  <TableHead>Trạng thái</TableHead>

                  <TableHead>Hoàn thành</TableHead>

                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.assignmentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            result.type === "quiz"
                              ? "bg-purple-50"
                              : "bg-blue-50"
                          }`}
                        >
                          {result.type === "quiz" ? (
                            <FileQuestion className="w-4 h-4 text-purple-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600" />
                          )}
                        </div>

                        <p className="font-medium text-gray-900">
                          {result.title}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Link
                        to={`/admin/classes/${result.classId}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {result.className}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={result.type === "quiz" ? "info" : "default"}
                      >
                        {result.type === "quiz" ? "Trắc nghiệm" : "Nộp tệp"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span
                        className={
                          result.score !== null
                            ? "font-semibold text-gray-900"
                            : "text-gray-400"
                        }
                      >
                        {formatScore(result)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getLearningStatusVariant(result.status)}>
                        {getLearningStatusLabel(result.status)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {result.completedAt
                          ? formatDateTime(result.completedAt)
                          : "-"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end">
                        <Link to={`/admin/assignments/${result.assignmentId}`}>
                          <Button variant="outline" size="sm">
                            Xem bài
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
