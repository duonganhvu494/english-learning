import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  FileQuestion,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import Card, { CardBody } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";

import { assignmentsApi, classesApi, getApiErrorMessage } from "@/api";

import type { AssignmentResponse, ClassResponse } from "@/types";

import { formatDateTime } from "@/app/utils/format";

type FilterValue = "all" | "open" | "upcoming" | "closed";

function assignmentTypeLabel(type: AssignmentResponse["type"]) {
  if (type === "quiz") {
    return "Trắc nghiệm";
  }

  return "Bài tập nộp tệp";
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "open") {
    return "Đang mở";
  }

  if (normalized === "upcoming") {
    return "Chưa mở";
  }

  if (normalized === "closed") {
    return "Đã đóng";
  }

  return "Không xác định";
}

function statusVariant(status: string): "success" | "info" | "default" {
  const normalized = status.toLowerCase();

  if (normalized === "open") {
    return "success";
  }

  if (normalized === "upcoming") {
    return "info";
  }

  return "default";
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);

  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState<FilterValue>("all");

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [assignmentItems, classItems] = await Promise.all([
        assignmentsApi.listMyAssignments(),
        classesApi.listMyClasses(),
      ]);

      setAssignments(
        [...assignmentItems].sort(
          (a, b) =>
            new Date(a.timeEnd).getTime() - new Date(b.timeEnd).getTime(),
        ),
      );

      setClasses(classItems);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách bài tập"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const classNameMap = useMemo(
    () => new Map(classes.map((item) => [item.id, item.className])),
    [classes],
  );

  const filteredAssignments = useMemo(() => {
    if (filter === "all") {
      return assignments;
    }

    return assignments.filter(
      (assignment) => assignment.status.toLowerCase() === filter,
    );
  }, [assignments, filter]);

  const filters: Array<{
    value: FilterValue;
    label: string;
  }> = [
    {
      value: "all",
      label: "Tất cả",
    },
    {
      value: "open",
      label: "Đang mở",
    },
    {
      value: "upcoming",
      label: "Chưa mở",
    },
    {
      value: "closed",
      label: "Đã đóng",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>

        <p className="text-gray-600 mt-1">
          Theo dõi bài tập và thời hạn nộp bài.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          Đang tải danh sách bài tập...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <FileText className="w-11 h-11 text-gray-300 mx-auto" />

            <h3 className="font-medium text-gray-700 mt-4">Không có bài tập</h3>

            <p className="text-sm text-gray-500 mt-1">
              Hiện chưa có bài tập phù hợp với trạng thái đã chọn.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const className = classNameMap.get(assignment.classId);

            const TypeIcon =
              assignment.type === "quiz" ? FileQuestion : FileText;

            return (
              <Card key={assignment.id} hover>
                <CardBody>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {assignment.title}
                          </h3>

                          <Badge variant={statusVariant(assignment.status)}>
                            {statusLabel(assignment.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />

                            {className || "Lớp học"}
                          </span>

                          <span>{assignmentTypeLabel(assignment.type)}</span>
                        </div>

                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                            {assignment.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3 text-sm">
                          <Clock3 className="w-4 h-4 text-gray-400" />

                          <span className="text-gray-500">Hạn nộp:</span>

                          <span className="font-medium text-gray-700">
                            {formatDateTime(assignment.timeEnd)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/student/assignments/${assignment.id}`}
                      className="shrink-0"
                    >
                      <Button variant="outline">
                        {assignment.type === "quiz"
                          ? assignment.status.toLowerCase() === "open"
                            ? "Làm bài"
                            : "Xem bài"
                          : "Xem chi tiết"}

                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
