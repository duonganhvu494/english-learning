**Bạn hãy đóng vai là một Expert Frontend Developer & UI/UX Designer. Nhiệm vụ của bạn là xây dựng hệ thống giao diện (UI/UX) cho một nền tảng SaaS Quản lý Trung tâm/Lớp học Tiếng Anh bằng react (English Learning Class Management SaaS).**

### 1. YÊU CẦU CHUNG (GENERAL REQUIREMENTS)
- **Ngôn ngữ:** 100% Tiếng Việt (UI text, placeholder, menu, alert...).
- **Giao diện (Theme):** Sử dụng 1 theme duy nhất (Sáng/Tối tuỳ chọn nhưng mặc định nên là Light theme sáng sủa, sạch sẽ, chuyên nghiệp).
- **Màu sắc chủ đạo:** Xanh dương (Primary Blue - tạo sự tin tưởng, chuẩn giáo dục) kết hợp với màu xám nhạt, viền tinh tế và nền trắng.
- **Phong cách:** Hiện đại, Minimalist, giống các SaaS platform hiện nay (ví dụ: Notion, Linear, Vercel). Sử dụng các component như thẻ (Cards), bảng (Tables) có phân trang, Dropdown, Modal/Dialog/Sheet cho các thao tác CRUD.
- **Responsive:** Giao diện hiển thị tốt trên cả Desktop và Mobile.

### 2. CẤU TRÚC LAYOUT CHÍNH (MAIN LAYOUT DASHBOARD)
Hệ thống sử dụng bố cục SaaS tiêu chuẩn với 2 Portal (Dành cho Quản trị viên/Giáo viên và Dành cho Học viên):
- **Sidebar (Trái - Cố định):** Chứa Logo, bộ chuyển đổi trung tâm (Workspace Switcher) và menu điều hướng chính: Tổng quan, Lớp học, Học viên, Tài liệu, Thanh toán, Cài đặt.
- **Header (Trên):** Thanh tìm kiếm toàn cục, Nút "Tạo mới" (Dropdown: Tạo lớp, Thêm học viên...), Icon Thông báo (có badged đếm số lượng chưa đọc), và User Avatar dropdown (Hồ sơ, Chế độ sáng/tối, Đăng xuất).

### 3. DANH SÁCH CÁC TRANG CẦN THIẾT (PAGES STRUCTURE)
Vui lòng tạo UI cho các trang sau:

#### A. Khu vực Public & Xác thực (Auth Pages)
1. **Landing Page:** Trang chủ giới thiệu tính năng SaaS, lợi ích cho trung tâm Tiếng Anh và Bảng giá (Pricing Plans - Gói Basic, Pro, Enterprise).
2. **Đăng nhập & Đăng ký (Login / Register):** Form đăng nhập và Form đăng ký tài khoản (hỗ trợ tạo Workspace mới cho chủ trung tâm).

#### B. Khu vực Quản lý (Admin / Teacher Portal)
3. **Dashboard (Tổng quan):** Thống kê tổng số học viên, lớp học đang hoạt động, doanh thu tháng (Billing), lịch dạy hôm nay và danh sách việc cần làm (chấm bài).
4. **Quản lý Trung tâm (Workspaces) & Học viên:**
   - Danh sách toàn bộ học viên thuộc Workspace.
   - Bảng quản lý học viên (Table) với chức năng Tìm kiếm, Lọc, Phân trang.
   - Modal thêm học viên mới hoặc Import bằng Excel.
5. **Quản lý Lớp học (Classes):**
   - Danh sách lớp học hiển thị dạng Lưới (Grid/Cards) kèm hình ảnh minh họa, thông tin sĩ số, giáo viên.
   - Nút "Tạo lớp học mới".
6. **Chi tiết Lớp học (Class Detail):**
   - **Tab "Thông tin":** Lịch học cơ bản, giáo viên phụ trách, giáo trình.
   - **Tab "Học viên":** Danh sách học viên trong lớp (Nút: Thêm/Xóa học viên, phân quyền Role lớp học).
   - **Tab "Buổi học" (Sessions):** Danh sách các buổi học (Ngày tháng, nội dung buổi học, trạng thái).
7. **Chi tiết Buổi học (Session Detail):**
   - **Điểm danh (Attendances):** Bảng học viên với các nút Checkmark: Có mặt (Present), Vắng mặt (Absent), Đi trễ (Late).
   - **Bài tập (Assignments):** Tạo bài tập về nhà, đính kèm file, thiết lập hạn nộp (Deadline).
   - **Tài liệu & Bài giảng (Materials / Lectures):** Khu vực upload và quản lý tài liệu.
8. **Chấm điểm & Nhận xét (Submissions):**
   - Danh sách các bài nộp của học viên cho một bài tập cụ thể. Trạng thái: Chưa nộp, Đã nộp, Đã chấm.
   - Giao diện chấm bài (Review): Có khu vực tải file bài làm, nhập điểm, và text area để ghi chú nhận xét.
9. **Cài đặt & Gói cước (Billing & Settings):**
   - Giao diện hiển thị thông tin gói cước (Subscription) hiện tại đang sử dụng. 
   - Quản lý nâng cấp gói cước và lịch sử thanh toán.

#### C. Khu vực Học viên (Student Portal)
10. **Bảng điều khiển Học viên:** Xem lịch học sắp tới, danh sách bài tập đang đến hạn (Todo list).
11. **Không gian Lớp học:** Xem thông tin lớp, tải tài liệu buổi học và xem tình trạng điểm danh của bản thân.
12. **Nộp bài tập:** Giao diện chi tiết bài tập, hiển thị nút Upload File (hỗ trợ kéo thả) để nộp bài và khu vực xem điểm/nhận xét của giáo viên.

### 4. DANH SÁCH API & DỮ LIỆU TÍCH HỢP (MOCK DATA & API MAPPING)
Hãy thiết kế các Form, Bảng và State dựa trên các API thực tế của hệ thống sau đây để chuẩn bị sẵn việc tích hợp Backend:

*   **Auth & Users:**
    *   `POST /users/register`, `POST /auth/login`
    *   `GET /users/me`, `PATCH /users/me` (Cập nhật Profile)
*   **Workspaces (Quản lý trung tâm):**
    *   `POST /workspaces` (Tạo trung tâm)
    *   `GET /workspaces/me/subscription`, `GET /workspaces/plans` (Gói cước/Billing)
    *   `GET /workspaces/:id/students`, `POST /workspaces/:id/students` (Học viên tổng)
*   **Classes (Lớp học):**
    *   `POST /workspaces/:workspaceId/classes`
    *   `GET /workspaces/:workspaceId/classes`
    *   `GET /classes/:classId/students`, `POST /classes/:classId/students`
    *   `PATCH /classes/:classId/students/:studentId/role` (RBAC trong lớp)
*   **Sessions (Buổi học & Lịch học):**
    *   `POST /classes/:classId/sessions`
    *   `GET /classes/:classId/sessions`
*   **Attendances (Điểm danh):**
    *   `GET /sessions/:sessionId/attendances`
    *   `PATCH /sessions/:sessionId/attendances/:studentId` (Cập nhật: present/absent/late)
*   **Assignments & Submissions (Bài tập & Nộp bài):**
    *   `POST /sessions/:sessionId/assignments` (Tạo bài tập)
    *   `POST /assignments/:assignmentId/submissions/me/upload-init` (Luồng upload tài liệu)
    *   `GET /assignments/:assignmentId/submissions/:studentId` (Tải/Xem bài nộp)
    *   `PATCH /assignments/:assignmentId/submissions/:studentId/review` (Chấm điểm)
*   **Notifications (Thông báo hệ thống):**
    *   `GET /notifications/me`, `GET /notifications/me/unread-count`, `PATCH /notifications/me/read-all`

### 5. YÊU CẦU ĐẦU RA CHO AI
- Thiết kế bố cục UI chi tiết cho các màn hình đã liệt kê.
- Form nhập liệu cần đầy đủ input (Text, Select, Datepicker, File upload kéo thả).
- Sử dụng Dữ liệu giả (Mock Data) bằng Tiếng Việt tự nhiên (Ví dụ: Tên lớp "IELTS Foundation 01", Tên học viên "Nguyễn Văn A", Thông báo "Bài tập của bạn đã được chấm"...).
- Viết code/layout sạch sẽ, phân chia Component rõ ràng.
