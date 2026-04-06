# English Learning Backend

Backend này phục vụ cho một hệ thống quản lý lớp học tiếng Anh theo mô hình SaaS. Nếu bạn chưa biết gì về codebase, hãy đọc tài liệu này như một bản mô tả hệ thống: backend này dùng để làm gì, hiện đang hỗ trợ những nghiệp vụ nào, source code được tổ chức ra sao và cần chạy local như thế nào.

## 1. Backend này dùng để làm gì?

Mục tiêu của hệ thống là hỗ trợ giáo viên hoặc trung tâm tiếng Anh quản lý toàn bộ hoạt động dạy học trong một nền tảng duy nhất.

Thay vì quản lý học viên, lớp học, buổi học, tài liệu, bài tập và bài nộp ở nhiều nơi khác nhau, backend này gom tất cả vào một domain chung với tư duy `workspace-first`.

Mỗi giáo viên bắt đầu từ một `workspace`, sau đó trong workspace đó có thể:

- quản lý học viên;
- tạo lớp học;
- tạo buổi học;
- điểm danh;
- phát hành lecture và materials;
- giao assignment dạng manual hoặc quiz;
- nhận submission và review bài nộp;
- quản lý quyền truy cập theo role và permission;
- quản lý plan, quota và recurring billing của workspace.

Nói ngắn gọn, đây là backend cho một sản phẩm EdTech có cả phần học tập lẫn phần vận hành SaaS.

## 2. Hệ thống hiện đang làm được những gì?

Ở trạng thái hiện tại, backend đã có các nhóm chức năng chính sau:

### Auth và quản lý người dùng

- đăng ký tài khoản giáo viên;
- đăng nhập bằng JWT qua cookie HTTP-only;
- refresh session bằng refresh token;
- logout và revoke session;
- xem thông tin người dùng hiện tại;
- cập nhật profile;
- super admin có thể xem và disable user.

### Workspaces và quản lý học viên

- tạo workspace cho giáo viên;
- lấy workspace hiện tại của người dùng;
- tạo học viên trong workspace;
- sửa thông tin học viên;
- xem danh sách học viên;
- gỡ học viên khỏi workspace;
- lấy current subscription và danh sách plan của workspace.

### Classes, sessions và attendances

- tạo class trong workspace;
- thêm học viên vào class;
- đổi role của học viên trong class;
- tạo và quản lý session cho class;
- xem và cập nhật attendance;
- cho học viên tự check-in attendance trong cửa sổ thời gian cho phép.

### Lectures, materials, assignments và submissions

- tạo lecture theo session;
- upload materials qua S3 multipart upload;
- gắn materials vào lecture hoặc assignment;
- tạo assignment dạng `manual` hoặc `quiz`;
- quản lý quiz question, option và attempt;
- học viên nộp submission cho manual assignment;
- giáo viên review submission và chấm điểm;
- tải file qua signed URL thay vì public trực tiếp.

### RBAC, notifications và billing

- RBAC hai tầng theo `workspace` và `class` scope;
- quản lý custom roles ở cả workspace và class;
- notification qua REST và WebSocket realtime;
- plan/feature management cho workspace;
- mock recurring billing với subscription, payment transaction và free fallback.

## 3. Hệ thống vận hành theo luồng nào?

Nếu đọc backend theo góc nhìn nghiệp vụ, luồng chính của hệ thống là:

1. Giáo viên đăng ký tài khoản và đăng nhập.
2. Giáo viên tạo `workspace` của mình.
3. Workspace được gán `free plan` mặc định.
4. Giáo viên tạo danh sách học viên ở cấp workspace.
5. Giáo viên tạo `class` và thêm học viên từ workspace vào class.
6. Trong mỗi class, giáo viên tạo `session` cho từng buổi học.
7. Trên mỗi session, giáo viên có thể:
   - điểm danh;
   - tạo lecture;
   - gắn materials;
   - tạo assignment;
   - theo dõi submission hoặc quiz attempt.
8. Hệ thống kiểm soát quyền truy cập bằng RBAC và kiểm soát quota/feature bằng workspace entitlement.
9. Khi workspace nâng cấp plan, billing module sẽ đồng bộ subscription đang áp dụng thật cho hệ thống.

Đây là lý do codebase được tổ chức quanh các thực thể như `workspace -> class -> session -> learning activity`, thay vì chỉ là một tập hợp endpoint rời rạc.

## 4. Những khái niệm quan trọng cần hiểu trước khi đọc code

### Workspace

Workspace là đơn vị trung tâm của hệ thống. Nó đóng vai trò như tenant trong mô hình SaaS, đồng thời là nơi chứa:

- thành viên;
- học viên;
- class;
- role tùy biến;
- subscription và entitlement.

### Workspace members

`workspace_members` biểu diễn người dùng thuộc workspace nào và có role gì ở cấp workspace. Đây là lớp quyền quản trị chung.

### Class students

`class_students` biểu diễn học viên thuộc class nào và có role gì ở cấp class. Đây là lớp quyền phục vụ hoạt động học tập trong lớp.

### Sessions

Session là buổi học của class. Nó là parent scope cho attendance, lecture và assignment.

### Materials

Material là file dùng chung trong hệ thống. Nó có thể được gắn vào lecture, assignment, quiz question hoặc submission. File thật được lưu trên S3, còn metadata nằm trong database.

### Workspace subscription

`workspace_subscriptions` là nguồn sự thật cho plan đang áp dụng thực tế lên workspace. Phần entitlement của hệ thống đọc từ đây để quyết định quota và feature có được phép dùng hay không.

## 5. Kiến trúc kỹ thuật tổng quan

Backend được xây bằng:

- NestJS + TypeScript;
- PostgreSQL + TypeORM;
- Redis cho session/rate limit/token state;
- AWS S3 cho storage;
- Socket.IO cho realtime notifications;
- Swagger cho API docs.

Các module chính đang có trong `src/`:

- `auth`, `auth-sessions`, `users`: xác thực, session, hồ sơ người dùng;
- `workspaces`: workspace, student lifecycle, plans, entitlement;
- `rbac`: roles, permissions, guards, access policy;
- `classes`, `sessions`, `attendances`: phần lõi của lớp học;
- `lectures`, `materials`: học liệu và file storage;
- `assignments`, `submissions`: bài tập, quiz, bài nộp;
- `notifications`: notification REST + realtime;
- `billing`: subscription, recurring flow, payment transaction;
- `storage`: S3 service và upload/download helpers.

Nếu bạn cần một điểm vào nhanh để hiểu toàn hệ thống, hãy mở:

- `src/app.module.ts` để xem các module chính;
- `src/workspaces` để hiểu mô hình domain trung tâm;
- `src/rbac` để hiểu lớp phân quyền;
- `src/auth` và `src/auth-sessions` để hiểu security model;
- `src/assignments`, `src/submissions`, `src/materials` để hiểu learning workflow.

## 6. Hệ thống đang bảo vệ dữ liệu như thế nào?

Backend hiện dùng mô hình auth dựa trên cookie HTTP-only:

- `accessToken`;
- `refreshToken`;
- `csrfToken` cho các request ghi dữ liệu.

Redis được dùng để:

- lưu refresh session;
- rotate refresh token;
- revoke session khi logout;
- denylist access token trong thời gian ngắn;
- rate limit login theo IP và username.

Ngoài auth, hệ thống còn có:

- CORS allowlist;
- CSRF middleware toàn cục;
- RBAC guards;
- plan guard để chặn thao tác khi workspace không đủ entitlement.

## 7. Storage và file upload hoạt động như thế nào?

File không đi trực tiếp qua backend theo kiểu upload một phát xong lưu local. Thay vào đó, hệ thống dùng multipart upload với presigned URL tới S3.

Flow chung là:

1. client gọi `upload-init` để tạo upload session;
2. backend trả metadata và thông tin multipart;
3. client xin signed URL cho từng part;
4. client upload trực tiếp lên S3;
5. client gọi `upload-complete` để backend finalize;
6. material chuyển sang trạng thái `ready`;
7. material sau đó mới được attach vào lecture, assignment hoặc submission.

Cách làm này giúp upload file lớn hiệu quả hơn và giữ storage pipeline nhất quán trên toàn hệ thống.

## 8. Billing trong backend này đang ở mức nào?

Billing hiện đã có đầy đủ structure cho một flow subscription-based SaaS, dù provider thanh toán hiện tại vẫn là mock.

Backend đang hỗ trợ:

- seed plan và feature cho workspace;
- free plan mặc định khi tạo workspace;
- current subscription của workspace;
- start paid billing subscription;
- initial transaction;
- mock pay / mock fail;
- recurring renewal bằng cron;
- fallback về free plan khi paid subscription kết thúc.

Điều quan trọng là entitlement của backend không đọc trực tiếp từ payment transaction, mà đọc từ workspace subscription đang có hiệu lực thật. Điều này làm kiến trúc rõ ràng hơn và dễ thay payment provider thật sau này.

## 9. Realtime đang dùng ở đâu?

Realtime hiện chủ yếu được dùng cho `notifications`.

Backend có WebSocket gateway riêng cho notifications, xác thực bằng access token cookie trong handshake. Khi có notification mới hoặc khi unread count thay đổi, gateway sẽ emit event tới đúng room của user tương ứng.

Điều này giúp frontend có thể vừa đọc notification history qua REST, vừa nhận update mới ngay lập tức qua socket.

## 10. Chạy local như thế nào?

### Yêu cầu

Bạn cần có:

- Node.js;
- npm;
- Docker.

### Bước 1: chạy Postgres và Redis

Ở thư mục root của repo:

```bash
docker compose up -d
```

### Bước 2: cấu hình biến môi trường cho backend

Tạo file `.env` trong `english-learning-be` dựa trên `.env.example`.

Các nhóm biến môi trường chính gồm:

- database;
- server;
- JWT và cookie security;
- Redis;
- auth security;
- attendance config;
- notifications config;
- S3 storage config.

### Bước 3: chạy backend

```bash
cd english-learning-be
npm install
npm run start:dev
```

### Bước 4: mở API docs nếu bật Swagger

Swagger được cấu hình trong backend và có thể bật qua config. Khi chạy local với swagger enabled, bạn có thể dùng API docs để xem nhanh các module và endpoint hiện có.

## 11. Những lệnh thường dùng

```bash
npm run start:dev
npm run build
npm run lint
npm test -- --runInBand
npm run test:e2e
```

## 12. Nếu là người mới đọc code, nên bắt đầu từ đâu?

Một lộ trình đọc code hợp lý là:

1. `src/app.module.ts`
   - để biết hệ thống có những module nào.
2. `src/workspaces`
   - để hiểu domain trung tâm và cách tenant/workspace hoạt động.
3. `src/rbac`
   - để hiểu role, permission và guards.
4. `src/auth` + `src/auth-sessions`
   - để hiểu auth flow, cookie security và Redis session.
5. `src/classes`, `src/sessions`, `src/attendances`
   - để hiểu classroom workflow.
6. `src/materials`, `src/lectures`, `src/assignments`, `src/submissions`
   - để hiểu file pipeline và learning workflow.
7. `src/billing` + `src/workspaces/workspace-entitlement.service.ts`
   - để hiểu plan, quota và billing flow.
8. `src/notifications`
   - để hiểu notification REST + realtime.

## 13. Tóm tắt ngắn gọn

Nếu phải mô tả backend này trong một câu:

Đây là một backend NestJS cho nền tảng quản lý lớp học tiếng Anh theo mô hình SaaS, hỗ trợ quản lý workspace, class, session, attendance, lecture, materials, assignment, quiz, submission, RBAC, notification realtime và recurring billing.
