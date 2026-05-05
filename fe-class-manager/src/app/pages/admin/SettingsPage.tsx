import { CreditCard, Building2, Users, Bell } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function SettingsPage() {
  const subscription = {
    plan: 'Pro',
    price: '699,000đ',
    period: 'tháng',
    nextBillingDate: '01/06/2026',
    status: 'active',
  };

  const billingHistory = [
    { date: '01/05/2026', amount: '699,000đ', status: 'paid', invoice: 'INV-2026-05' },
    { date: '01/04/2026', amount: '699,000đ', status: 'paid', invoice: 'INV-2026-04' },
    { date: '01/03/2026', amount: '699,000đ', status: 'paid', invoice: 'INV-2026-03' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin trung tâm và gói cước</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Gói cước hiện tại</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-bold text-gray-900">{subscription.plan}</h4>
                    <Badge variant="success">Đang hoạt động</Badge>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-1">
                    {subscription.price}
                    <span className="text-lg text-gray-600">/{subscription.period}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Ngày gia hạn tiếp theo: {subscription.nextBillingDate}
                  </p>
                </div>
                <Button variant="outline">Nâng cấp gói</Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h5 className="font-medium text-gray-900 mb-3">Quyền lợi gói Pro</h5>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Không giới hạn lớp học
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Tối đa 200 học viên
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Quản lý bài tập nâng cao
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Báo cáo chi tiết
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Hỗ trợ ưu tiên
                  </li>
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Lịch sử thanh toán</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {billingHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.invoice}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.amount}</p>
                      <Badge variant="success" className="mt-1">Đã thanh toán</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Thông tin trung tâm</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Tên trung tâm</p>
                <p className="font-medium text-gray-900">Trung tâm A</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mã trung tâm</p>
                <p className="font-medium text-gray-900 font-mono">WS-001234</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Người quản lý</p>
                <p className="font-medium text-gray-900">Nguyễn Văn Admin</p>
              </div>
              <Button variant="outline" className="w-full">
                Chỉnh sửa thông tin
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Sử dụng</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Học viên</p>
                  <p className="text-sm font-medium text-gray-900">248/200</p>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-red-600" style={{ width: '124%' }}></div>
                </div>
                <p className="text-xs text-red-600 mt-1">Vượt quá giới hạn 48 học viên</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Lớp học</p>
                  <p className="text-sm font-medium text-gray-900">12/Không giới hạn</p>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-green-600" style={{ width: '20%' }}></div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Thông báo</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email thông báo</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Nhắc nhở bài tập</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Báo cáo tuần</span>
                <input type="checkbox" className="rounded" />
              </label>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
