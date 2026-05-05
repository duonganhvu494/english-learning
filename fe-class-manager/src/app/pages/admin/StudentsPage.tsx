import { useState } from 'react';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';

export default function StudentsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  const students = [
    { id: '1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', class: 'IELTS Foundation 01', status: 'active', joinDate: '01/01/2026' },
    { id: '2', fullName: 'Trần Thị B', email: 'tranthib@gmail.com', class: 'TOEIC Advanced', status: 'active', joinDate: '05/01/2026' },
    { id: '3', fullName: 'Lê Văn C', email: 'levanc@gmail.com', class: 'Business English', status: 'active', joinDate: '10/01/2026' },
    { id: '4', fullName: 'Phạm Thị D', email: 'phamthid@gmail.com', class: 'IELTS Foundation 01', status: 'inactive', joinDate: '15/01/2026' },
    { id: '5', fullName: 'Hoàng Văn E', email: 'hoangvane@gmail.com', class: 'TOEIC Advanced', status: 'active', joinDate: '20/01/2026' },
    { id: '6', fullName: 'Võ Thị F', email: 'vothif@gmail.com', class: 'Business English', status: 'active', joinDate: '25/01/2026' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAddModal(false);
    setFormData({ fullName: '', email: '' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Học viên</h1>
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
          <Button onClick={() => setShowAddModal(true)}>
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
                <TableHead>Lớp học</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
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
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                      {student.status === 'active' ? 'Đang học' : 'Tạm nghỉ'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:underline">Xem</button>
                      <button className="text-sm text-blue-600 hover:underline">Sửa</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Hiển thị 1-6 trong tổng số 6 học viên</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Trước</Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm" disabled>Sau</Button>
            </div>
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
              Hủy
            </Button>
            <Button type="submit">Thêm học viên</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
