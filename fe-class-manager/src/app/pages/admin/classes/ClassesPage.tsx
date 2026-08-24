import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Search, School, Users } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Card, { CardBody } from "@/app/components/ui/Card";

import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";

import { classesApi, getApiErrorMessage } from "@/api";

import { resolveWorkspaceId } from "@/app/utils/workspace";

import type { ClassResponse } from "@/types";

import CreateClassModal, {
  type CreateClassFormValue,
} from "./CreateClassModal";

export default function ClassesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const loadClasses = async (targetWorkspaceId?: string) => {
    const activeWorkspaceId = targetWorkspaceId ?? workspaceId;

    if (!activeWorkspaceId) {
      return;
    }

    try {
      const items = await classesApi.listWorkspaceClasses(activeWorkspaceId);

      setClasses(items);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách lớp học"));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);

      try {
        const resolvedWorkspaceId = await resolveWorkspaceId();

        setWorkspaceId(resolvedWorkspaceId);

        await loadClasses(resolvedWorkspaceId);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Không thể xác định không gian làm việc"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return classes;
    }

    return classes.filter(
      (classItem) =>
        classItem.className.toLowerCase().includes(query) ||
        (classItem.description ?? "").toLowerCase().includes(query),
    );
  }, [classes, searchQuery]);

  const totalStudents = useMemo(
    () =>
      classes.reduce((total, classItem) => total + classItem.studentCount, 0),
    [classes],
  );

  const handleCreateClass = async (formData: CreateClassFormValue) => {
    if (!workspaceId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await classesApi.createClass(workspaceId, {
        className: formData.className,

        description: formData.description.trim() || undefined,
      });

      toast.success("Tạo lớp học thành công");

      await loadClasses(workspaceId);

      setShowCreateModal(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tạo lớp học"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h1>

          <p className="text-gray-600 mt-1">
            Tạo và quản lý các lớp học trong workspace
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!workspaceId}
        >
          <Plus className="w-4 h-4" />
          Tạo lớp học
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng số lớp</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {classes.length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <School className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Học viên trong các lớp</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalStudents}
                </p>
              </div>

              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* CLASS LIST */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Danh sách lớp học</h2>

              <p className="text-sm text-gray-500 mt-1">
                {classes.length} lớp học
              </p>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                placeholder="Tìm kiếm lớp học..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Đang tải danh sách lớp học...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp học</TableHead>

                  <TableHead>Mô tả</TableHead>

                  <TableHead>Học viên</TableHead>

                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <School className="w-10 h-10 text-gray-300 mx-auto" />

                      <p className="text-sm text-gray-500 mt-3">
                        {searchQuery
                          ? "Không tìm thấy lớp học phù hợp"
                          : "Chưa có lớp học nào"}
                      </p>

                      {!searchQuery && (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => setShowCreateModal(true)}
                        >
                          <Plus className="w-4 h-4" />
                          Tạo lớp học
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell>
                        <Link
                          to={`/admin/classes/${classItem.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <School className="w-5 h-5 text-blue-600" />
                          </div>

                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-600">
                              {classItem.className}
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                              Lớp học
                            </p>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-md line-clamp-2">
                          {classItem.description || "Chưa có mô tả"}
                        </p>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />

                          <span className="text-sm font-medium text-gray-900">
                            {classItem.studentCount}
                          </span>

                          <span className="text-sm text-gray-500">
                            học viên
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end">
                          <Link to={`/admin/classes/${classItem.id}`}>
                            <Button variant="outline" size="sm">
                              Xem chi tiết
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {!isLoading && classes.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Hiển thị {filteredClasses.length} / {classes.length} lớp học
              </p>

              <p className="text-sm text-gray-500">
                Tổng {totalStudents} học viên
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <CreateClassModal
        isOpen={showCreateModal}
        isSubmitting={isSubmitting}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClass}
      />
    </div>
  );
}
