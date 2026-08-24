import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Download,
  Filter,
  Plus,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Card, { CardBody } from "@/app/components/ui/Card";

import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";

import Badge from "@/app/components/ui/Badge";

import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";

import { getApiErrorMessage, workspacesApi } from "@/api";

import { resolveWorkspaceId } from "@/app/utils/workspace";

import type { WorkspaceStudentListItem } from "@/types";

type StudentFormErrors = {
  fullName?: string;
  email?: string;
};

export default function StudentsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [students, setStudents] = useState<WorkspaceStudentListItem[]>([]);

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  const [errors, setErrors] = useState<StudentFormErrors>({});

  const loadStudents = async (targetWorkspaceId?: string) => {
    const activeWorkspaceId = targetWorkspaceId ?? workspaceId;

    if (!activeWorkspaceId) {
      return;
    }

    try {
      const items =
        await workspacesApi.listWorkspaceStudents(activeWorkspaceId);

      setStudents(items);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải danh sách học viên"),
      );
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);

      try {
        const resolvedWorkspaceId = await resolveWorkspaceId();

        setWorkspaceId(resolvedWorkspaceId);

        await loadStudents(resolvedWorkspaceId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Không thể xác định workspace"));
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [student.fullName, student.email, student.userName].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery, students]);

  const activeStudentCount = useMemo(
    () => students.filter((student) => student.status === "active").length,
    [students],
  );

  const validateForm = () => {
    const nextErrors: StudentFormErrors = {};

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();

    if (!fullName) {
      nextErrors.fullName = "Họ tên không được để trống";
    }

    if (!email) {
      nextErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Email không đúng định dạng";
    } else {
      const emailExists = students.some(
        (student) => student.email.trim().toLowerCase() === email.toLowerCase(),
      );

      if (emailExists) {
        nextErrors.email = "Học viên với email này đã có trong workspace";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!workspaceId || isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await workspacesApi.createWorkspaceStudent(workspaceId, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      });

      toast.success("Thêm học viên thành công");

      await loadStudents(workspaceId);

      setShowAddModal(false);

      setFormData({
        fullName: "",
        email: "",
      });

      setErrors({});
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể thêm học viên"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAddModal = () => {
    if (isSubmitting) {
      return;
    }

    setShowAddModal(false);

    setFormData({
      fullName: "",
      email: "",
    });

    setErrors({});
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý học viên</h1>

          <p className="text-gray-600 mt-1">
            Quản lý thông tin và theo dõi học viên
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>

          <Button variant="outline">
            <Upload className="w-4 h-4" />
            Nhập Excel
          </Button>

          <Button onClick={() => setShowAddModal(true)} disabled={!workspaceId}>
            <Plus className="w-4 h-4" />
            Thêm học viên
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng học viên</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {students.length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang hoạt động</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {activeStudentCount}
                </p>
              </div>

              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, username..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button variant="outline">
              <Filter className="w-4 h-4" />
              Lọc
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Đang tải danh sách học viên...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-sm text-gray-500"
                    >
                      {searchQuery
                        ? "Không tìm thấy học viên phù hợp"
                        : "Chưa có học viên"}
                    </TableCell>
                  </TableRow>
                )}

                {filteredStudents.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>
                      <Link
                        to={`/admin/students/${student.studentId}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-blue-600 font-medium text-sm">
                            {student.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {student.fullName}
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Xem hồ sơ học viên
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {student.email}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {student.userName}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="default">{student.role}</Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          student.status === "active" ? "success" : "warning"
                        }
                      >
                        {student.status === "active"
                          ? "Hoạt động"
                          : student.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end">
                        <Link to={`/admin/students/${student.studentId}`}>
                          <Button variant="outline" size="sm">
                            Xem chi tiết
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

          {!isLoading && students.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Hiển thị {filteredStudents.length} / {students.length} học viên
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Thêm học viên mới"
      >
        <form onSubmit={handleSubmit} noValidate>
          <ModalBody className="space-y-4">
            <Input
              label="Họ và tên"
              name="fullName"
              placeholder="Nhập họ tên học viên"
              value={formData.fullName}
              error={errors.fullName}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  fullName: event.target.value,
                });

                if (errors.fullName) {
                  setErrors((prev) => ({
                    ...prev,
                    fullName: undefined,
                  }));
                }
              }}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              error={errors.email}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  email: event.target.value,
                });

                if (errors.email) {
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined,
                  }));
                }
              }}
              required
            />
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseAddModal}
              disabled={isSubmitting}
            >
              Hủy
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm học viên"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
