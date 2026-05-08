import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, UserCheck, FileText, Upload, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { assignmentsApi, attendancesApi, getApiErrorMessage, sessionsApi } from '@/api';
import type {
  AssignmentResponse,
  AttendanceItem,
  AttendanceStatusInput,
  AttendanceStatusValue,
  SessionResponse,
} from '@/types';
import { formatDateTime, toIsoFromLocalDateTime } from '@/app/utils/format';

type AttendanceViewStatus = 'PRESENT' | 'ABSENT' | 'LATE';

function toViewStatus(value: AttendanceStatusValue | null): AttendanceViewStatus {
  if (value === 'absent') {
    return 'ABSENT';
  }
  if (value === 'late') {
    return 'LATE';
  }
  return 'PRESENT';
}

function fromViewStatus(value: AttendanceViewStatus): AttendanceStatusInput {
  return value;
}

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'materials'>('attendance');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionResponse | null>(null);
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: '',
    description: '',
    timeStart: '',
    timeEnd: '',
    type: 'MANUAL',
  });

  const loadData = async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);
    try {
      const [session, attendances, sessionAssignments] = await Promise.all([
        sessionsApi.getSession(sessionId),
        attendancesApi.getSessionAttendances(sessionId),
        assignmentsApi.listSessionAssignments(sessionId),
      ]);
      setSessionInfo(session);
      setAttendanceItems(attendances.attendances);
      setAssignments(sessionAssignments);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải chi tiết buổi học'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [sessionId]);

  const attendanceView = useMemo(
    () => attendanceItems.map((item) => ({ ...item, viewStatus: toViewStatus(item.status) })),
    [attendanceItems],
  );

  const handleAttendanceChange = async (studentId: string, status: AttendanceViewStatus) => {
    if (!sessionId) {
      return;
    }

    try {
      await attendancesApi.updateAttendance(sessionId, studentId, {
        status: fromViewStatus(status),
      });
      setAttendanceItems((prev) =>
        prev.map((item) =>
          item.studentId === studentId
            ? {
                ...item,
                status: status.toLowerCase() as AttendanceStatusValue,
              }
            : item,
        ),
      );
      toast.success('Cập nhật điểm danh thành công');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật điểm danh'));
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || isSavingAssignment) {
      return;
    }

    setIsSavingAssignment(true);
    try {
      await assignmentsApi.createAssignment(sessionId, {
        title: assignmentFormData.title,
        description: assignmentFormData.description || undefined,
        timeStart: toIsoFromLocalDateTime(assignmentFormData.timeStart),
        timeEnd: toIsoFromLocalDateTime(assignmentFormData.timeEnd),
        type: assignmentFormData.type as 'MANUAL' | 'QUIZ',
      });
      toast.success('Tạo bài tập thanh cong');
      setShowAssignmentModal(false);
      setAssignmentFormData({
        title: '',
        description: '',
        timeStart: '',
        timeEnd: '',
        type: 'MANUAL',
      });
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tạo bài tập'));
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const getStatusColor = (status: AttendanceViewStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: AttendanceViewStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'Co mat';
      case 'ABSENT':
        return 'Vang';
      case 'LATE':
        return 'Tre';
      default:
        return status;
    }
  };

  const tabs = [
    { id: 'attendance', label: 'Diem danh', icon: UserCheck },
    { id: 'assignments', label: 'Bài tập', icon: FileText },
    { id: 'materials', label: 'Tài liệu', icon: Upload },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={sessionInfo ? `/admin/classes/${sessionInfo.classId}` : '/admin/classes'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{sessionInfo?.topic || 'Session detail'}</h1>
          <p className="text-gray-600 mt-1">
            Class: {sessionInfo?.classId || '-'} • {formatDateTime(sessionInfo?.timeStart)}
          </p>
        </div>
      </div>

      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Class</p>
            <p className="font-medium text-gray-900 break-all">{sessionInfo?.classId || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Workspace</p>
            <p className="font-medium text-gray-900 break-all">{sessionInfo?.workspaceId || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bat dau</p>
            <p className="font-medium text-gray-900">{formatDateTime(sessionInfo?.timeStart)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ket thuc</p>
            <p className="font-medium text-gray-900">{formatDateTime(sessionInfo?.timeEnd)}</p>
          </div>
        </CardBody>
      </Card>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'attendance' | 'assignments' | 'materials')}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Diem danh hoc vien</h3>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead>Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && attendanceView.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="text-center py-8 text-sm text-gray-500">Chưa có dữ liệu điểm danh</div>
                    </TableCell>
                  </TableRow>
                )}
                {attendanceView.map((attendance) => (
                  <TableRow key={attendance.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {attendance.fullName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{attendance.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(attendance.viewStatus)}`}>
                        {getStatusLabel(attendance.viewStatus)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAttendanceChange(attendance.studentId, 'PRESENT')}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            attendance.viewStatus === 'PRESENT'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Co mat
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(attendance.studentId, 'LATE')}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            attendance.viewStatus === 'LATE'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Tre
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(attendance.studentId, 'ABSENT')}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            attendance.viewStatus === 'ABSENT'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Vang
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {activeTab === 'assignments' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Bài tập</h3>
            <Button size="sm" onClick={() => setShowAssignmentModal(true)}>
              <Plus className="w-4 h-4" />
              Tạo bài tập
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {!isLoading && assignments.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 border rounded-lg">Chưa có bài tập nào</div>
              )}
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/admin/assignments/${assignment.id}/submissions`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <Badge variant={assignment.type === 'quiz' ? 'info' : 'default'}>
                          {assignment.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Hạn nộp: {formatDateTime(assignment.timeEnd)} • Status: {assignment.status}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'materials' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tài liệu buổi học</h3>
            <Button size="sm" disabled>
              <Upload className="w-4 h-4" />
              Tai len tai lieu
            </Button>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-gray-500">Tinh nang tai lieu buoi hoc se duoc ket noi o API materials rieng.</div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={showAssignmentModal} onClose={() => setShowAssignmentModal(false)} title="Tạo bài tập moi" size="lg">
        <form onSubmit={handleAddAssignment}>
          <ModalBody className="space-y-4">
            <Input
              label="Tieu de bai tap"
              name="title"
              placeholder="Vi du: Bài tập Reading Comprehension"
              value={assignmentFormData.title}
              onChange={(e) => setAssignmentFormData({ ...assignmentFormData, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                name="description"
                placeholder="Mô tả chi tiết bài tập"
                value={assignmentFormData.description}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loai bai tap</label>
              <select
                name="type"
                value={assignmentFormData.type}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANUAL">Bài tập thường</option>
                <option value="QUIZ">Trắc nghiệm</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Thoi gian mo"
                type="datetime-local"
                name="timeStart"
                value={assignmentFormData.timeStart}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, timeStart: e.target.value })}
                required
              />
              <Input
                label="Hạn nộp"
                type="datetime-local"
                name="timeEnd"
                value={assignmentFormData.timeEnd}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, timeEnd: e.target.value })}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)} type="button">
              Huy
            </Button>
            <Button type="submit" disabled={isSavingAssignment}>
              {isSavingAssignment ? 'Đang tạo...' : 'Tạo bài tập'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}


