import { useState } from 'react';
import { Plus, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function ClassesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    className: '',
    description: '',
  });

  const classes = [
    {
      id: '1',
      className: 'IELTS Foundation 01',
      description: 'Lớp học IELTS cơ bản dành cho người mới bắt đầu',
      teacher: 'Nguyễn Thị Lan',
      students: 24,
      sessions: 36,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    },
    {
      id: '2',
      className: 'TOEIC Advanced',
      description: 'Lớp học TOEIC nâng cao, mục tiêu 850+',
      teacher: 'Trần Văn Nam',
      students: 18,
      sessions: 30,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    },
    {
      id: '3',
      className: 'Business English',
      description: 'Tiếng Anh thương mại cho người đi làm',
      teacher: 'Lê Thị Mai',
      students: 15,
      sessions: 24,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop',
    },
    {
      id: '4',
      className: 'IELTS Foundation 02',
      description: 'Lớp học IELTS cơ bản khóa 2',
      teacher: 'Phạm Văn Hùng',
      students: 20,
      sessions: 36,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateModal(false);
    setFormData({ className: '', description: '' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h1>
          <p className="text-gray-600 mt-1">Tạo và quản lý các lớp học của trung tâm</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Tạo lớp học mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Link key={classItem.id} to={`/admin/classes/${classItem.id}`}>
            <Card hover className="h-full">
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img
                  src={classItem.image}
                  alt={classItem.className}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{classItem.className}</h3>
                  <Badge variant={classItem.status === 'active' ? 'success' : 'warning'}>
                    {classItem.status === 'active' ? 'Đang diễn ra' : 'Sắp mở'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {classItem.description}
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Giáo viên:</span> {classItem.teacher}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{classItem.students} học viên</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{classItem.sessions} buổi</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo lớp học mới">
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <Input
              label="Tên lớp học"
              name="className"
              placeholder="Ví dụ: IELTS Foundation 01"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                placeholder="Mô tả ngắn về lớp học"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} type="button">
              Hủy
            </Button>
            <Button type="submit">Tạo lớp học</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
