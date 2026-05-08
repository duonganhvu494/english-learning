import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import {
  assignmentsApi,
  attendancesApi,
  getApiErrorMessage,
  lecturesApi,
  resolveApiUrl,
  sessionsApi,
} from '@/api';
import type {
  AttendanceStatusValue,
  LectureResponse,
  SessionResponse,
} from '@/types';
import { formatDateTime } from '@/app/utils/format';

type SessionAttendanceSummary = {
  sessionId: string;
  status: AttendanceStatusValue | null;
};

type ClassroomMaterialItem = {
  key: string;
  lectureTitle: string;
  fileName: string;
  size: number | null;
  downloadUrl: string;
};

function attendanceLabel(status: AttendanceStatusValue | null): string {
  if (status === 'present') {
    return 'Có mặt';
  }
  if (status === 'late') {
    return 'Đi trễ';
  }
  if (status === 'absent') {
    return 'Vắng mặt';
  }
  return 'Chưa điểm danh';
}

function attendanceVariant(status: AttendanceStatusValue | null): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'present') {
    return 'success';
  }
  if (status === 'late') {
    return 'warning';
  }
  if (status === 'absent') {
    return 'danger';
  }
  return 'default';
}

function renderAttendanceIcon(status: AttendanceStatusValue | null) {
  if (status === 'present') {
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
  if (status === 'late') {
    return <Clock className="w-4 h-4 text-yellow-600" />;
  }
  if (status === 'absent') {
    return <XCircle className="w-4 h-4 text-red-600" />;
  }
  return null;
}

function formatFileSize(sizeInBytes: number | null): string {
  if (!sizeInBytes || sizeInBytes <= 0) {
    return '-';
  }
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function StudentClassroom() {
  const { classId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [attendances, setAttendances] = useState<SessionAttendanceSummary[]>([]);
  const [lecturesBySession, setLecturesBySession] = useState<Record<string, LectureResponse[]>>({});
  const [assignmentCount, setAssignmentCount] = useState(0);

  const loadData = async () => {
    if (!classId) {
      return;
    }

    setIsLoading(true);
    try {
      const sessionList = await sessionsApi.listClassSessions(classId);
      const sortedSessions = [...sessionList].sort(
        (a, b) => new Date(b.timeStart).getTime() - new Date(a.timeStart).getTime(),
      );
      setSessions(sortedSessions);

      const perSessionData = await Promise.all(
        sortedSessions.map(async (session) => {
          const [attendance, lectures, assignments] = await Promise.all([
            attendancesApi.getMyAttendance(session.id).catch(() => null),
            lecturesApi.listSessionLectures(session.id).catch(() => [] as LectureResponse[]),
            assignmentsApi.listSessionAssignments(session.id).catch(() => []),
          ]);
          return { session, attendance, lectures, assignments };
        }),
      );

      const attendanceItems: SessionAttendanceSummary[] = perSessionData.map((item) => ({
        sessionId: item.session.id,
        status: item.attendance?.status ?? null,
      }));
      setAttendances(attendanceItems);

      const lecturesMap: Record<string, LectureResponse[]> = {};
      let totalAssignments = 0;
      perSessionData.forEach((item) => {
        lecturesMap[item.session.id] = item.lectures;
        totalAssignments += item.assignments.length;
      });
      setLecturesBySession(lecturesMap);
      setAssignmentCount(totalAssignments);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải dữ liệu lớp học'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [classId]);

  const attendanceMap = useMemo(
    () => new Map(attendances.map((item) => [item.sessionId, item.status])),
    [attendances],
  );

  const attendanceStats = useMemo(() => {
    const present = attendances.filter((item) => item.status === 'present').length;
    const late = attendances.filter((item) => item.status === 'late').length;
    const absent = attendances.filter((item) => item.status === 'absent').length;
    const total = attendances.length;
    return { present, late, absent, total };
  }, [attendances]);

  const classMaterials = useMemo(() => {
    const items: ClassroomMaterialItem[] = [];
    Object.values(lecturesBySession).forEach((lectures) => {
      lectures.forEach((lecture) => {
        lecture.materials.forEach((material) => {
          items.push({
            key: `${lecture.id}-${material.id}`,
            lectureTitle: lecture.title,
            fileName: material.fileName,
            size: material.size,
            downloadUrl: material.downloadUrl,
          });
        });
      });
    });
    return items;
  }, [lecturesBySession]);

  const className = classId ? `Lớp ${classId.slice(0, 8)}` : 'Lớp học';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{className}</h1>
        <p className="text-gray-600 mt-1">
          Theo dõi lịch học, tài liệu và điểm danh của bạn trong lớp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thông tin lớp học</h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Giáo viên</p>
                <p className="font-medium text-gray-900">-</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phòng học</p>
                <p className="font-medium text-gray-900">-</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Số buổi học</p>
                <p className="font-medium text-gray-900">{sessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng bài tập</p>
                <p className="font-medium text-gray-900">{assignmentCount}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Lịch sử buổi học</h3>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="text-center py-8 text-sm text-gray-500">Đang tải dữ liệu...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">Chưa có buổi học nào</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const attendanceStatus = attendanceMap.get(session.id) ?? null;
                    const isUpcoming = new Date(session.timeStart).getTime() > Date.now();
                    return (
                      <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{session.topic}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDateTime(session.timeStart)} - {formatDateTime(session.timeEnd)}
                            </p>
                            <div className="mt-2">
                              <Badge variant={isUpcoming ? 'info' : 'default'}>
                                {isUpcoming ? 'Sắp diễn ra' : 'Đã diễn ra'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderAttendanceIcon(attendanceStatus)}
                            <Badge variant={attendanceVariant(attendanceStatus)}>
                              {attendanceLabel(attendanceStatus)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Tài liệu lớp học</h3>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="text-center py-8 text-sm text-gray-500">Đang tải dữ liệu...</div>
              ) : classMaterials.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">Chưa có tài liệu nào</div>
              ) : (
                <div className="space-y-3">
                  {classMaterials.map((material) => (
                    <div
                      key={material.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{material.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {material.lectureTitle} • {formatFileSize(material.size)}
                          </p>
                        </div>
                      </div>
                      <a href={resolveApiUrl(material.downloadUrl)} target="_blank" rel="noreferrer">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Điểm danh của tôi</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-4xl font-bold text-blue-600 mb-1">
                  {attendanceStats.total > 0
                    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-600">Tỷ lệ có mặt</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Có mặt</span>
                  </div>
                  <span className="font-semibold text-gray-900">{attendanceStats.present}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">Đi trễ</span>
                  </div>
                  <span className="font-semibold text-gray-900">{attendanceStats.late}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-700">Vắng mặt</span>
                  </div>
                  <span className="font-semibold text-gray-900">{attendanceStats.absent}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
