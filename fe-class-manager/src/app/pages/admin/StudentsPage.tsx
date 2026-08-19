import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import { getApiErrorMessage, workspacesApi } from '@/api';
import { resolveWorkspaceId } from '@/app/utils/workspace';
import type { WorkspaceStudentListItem } from '@/types';

export default function StudentsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<WorkspaceStudentListItem[]>([]);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  const loadStudents = async (targetWorkspaceId?: string) => {
    const activeWorkspaceId = targetWorkspaceId || workspaceId;
    if (!activeWorkspaceId) {
      return;
    }

    try {
      const items = await workspacesApi.listWorkspaceStudents(activeWorkspaceId);
      setStudents(items);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách học viên'));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const resolvedWorkspaceId = await resolveWorkspaceId();
        setWorkspaceIdState(resolvedWorkspaceId);
        await loadStudents(resolvedWorkspaceId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Không thể xác định workspace'));
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return students;
    }
    return students.filter((student) =>
      [student.fullName, student.email, student.userName].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [searchQuery, students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await workspacesApi.createWorkspaceStudent(workspaceId, {
        fullName: formData.fullName,
        email: formData.email,
      });
      toast.success('Thêm học viên thành công');
      await loadStudents(workspaceId);
      setShowAddModal(false);
      setFormData({ fullName: '', email: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể thêm học viên'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý học viên</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin và theo dõi học viên</p>
        </div>
        <div className="flex gap-3">
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

      <Card>
        <CardBody>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4" />
              Lọc
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="text-center py-8 text-sm text-gray-500">Không có học viên</div>
                  </TableCell>
                </TableRow>
              )}
              {filteredStudents.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {student.fullName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{student.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.userName}</TableCell>
                  <TableCell>
                    <Badge variant="default">{student.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'success' : 'warning'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredStudents.length} / {students.length} hoc vien
            </p>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm học viên mới">
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <Input
              label="Họ và tên"
              name="fullName"
              placeholder="Nhập họ tên học viên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} type="button">
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang thêm...' : 'Thêm học viên'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}


