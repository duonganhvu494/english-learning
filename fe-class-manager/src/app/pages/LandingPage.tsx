import { Link } from 'react-router';
import { BookOpen, Users, FileText, BarChart, Check } from 'lucide-react';
import Button from '../components/ui/Button';

export default function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Quản lý lớp học',
      description: 'Tạo và quản lý nhiều lớp học, phân công giáo viên, theo dõi tiến độ học tập',
    },
    {
      icon: Users,
      title: 'Quản lý học viên',
      description: 'Thêm học viên, phân loại theo lớp, theo dõi thông tin và kết quả học tập',
    },
    {
      icon: FileText,
      title: 'Bài tập & Tài liệu',
      description: 'Giao bài tập, thu bài, chấm điểm tự động, chia sẻ tài liệu học tập',
    },
    {
      icon: BarChart,
      title: 'Báo cáo & Thống kê',
      description: 'Xem báo cáo chi tiết về điểm danh, kết quả học tập, doanh thu',
    },
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: '299,000',
      period: 'tháng',
      features: [
        'Tối đa 3 lớp học',
        '50 học viên',
        'Quản lý bài tập cơ bản',
        'Hỗ trợ email',
      ],
    },
    {
      name: 'Pro',
      price: '699,000',
      period: 'tháng',
      features: [
        'Không giới hạn lớp học',
        '200 học viên',
        'Quản lý bài tập nâng cao',
        'Báo cáo chi tiết',
        'Hỗ trợ ưu tiên',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Liên hệ',
      period: '',
      features: [
        'Không giới hạn',
        'Tùy chỉnh theo yêu cầu',
        'API tích hợp',
        'Đào tạo chuyên sâu',
        'Hỗ trợ 24/7',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">EnglishClass</h1>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button>Dùng thử miễn phí</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Giải pháp quản lý trung tâm
          <br />
          <span className="text-blue-600">Tiếng Anh chuyên nghiệp</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Nền tảng SaaS toàn diện giúp bạn quản lý lớp học, học viên, bài tập và thanh toán
          một cách dễ dàng và hiệu quả
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg">Bắt đầu ngay - Miễn phí 14 ngày</Button>
          </Link>
          <Button variant="outline" size="lg">Xem demo</Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tính năng nổi bật</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Bảng giá linh hoạt</h2>
          <p className="text-gray-600 text-center mb-12">
            Chọn gói phù hợp với quy mô trung tâm của bạn
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg border-2 p-8 ${
                  plan.popular ? 'border-blue-600 shadow-lg' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Phổ biến nhất
                  </span>
                )}
                <h3 className="text-xl font-bold mt-4 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">đ/{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.price === 'Liên hệ' ? 'Liên hệ ngay' : 'Chọn gói này'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">EnglishClass</h2>
          <p className="text-gray-400 mb-6">
            Giải pháp quản lý trung tâm Tiếng Anh chuyên nghiệp
          </p>
          <p className="text-sm text-gray-500">© 2026 EnglishClass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
