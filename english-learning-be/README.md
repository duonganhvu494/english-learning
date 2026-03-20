# English Learning Backend

Backend NestJS cho hệ thống quản lý dạy học tiếng Anh theo mô hình `workspace-first`.

## 1. Mục tiêu hiện tại

Dự án hiện đang tập trung vào phần lõi của hệ thống:

- xác thực bằng JWT qua cookie HTTP-only
- quản lý session đăng nhập bằng Redis
- quản lý `workspace`, `student`, `class`, `session`, `attendance`
- RBAC theo 2 scope:
  - `workspace`
  - `class`
- quản lý `lecture`, `materials`, `assignment`, `submission`

## 2. Công nghệ đang dùng

- NestJS
- TypeORM
- PostgreSQL
- Redis
- Passport JWT
- class-validator
- Jest

## 3. Cách hiểu domain hiện tại

Luồng nghiệp vụ đã chốt:

1. Giáo viên tạo `workspace`.
2. Trong `workspace`, giáo viên tạo học sinh.
3. Từ danh sách học sinh của `workspace`, giáo viên đưa học sinh vào `class`.
4. Mỗi `class` có nhiều `session`.
5. Mỗi `session` có `attendance` theo từng học sinh.

Quan hệ dữ liệu chính:

- `workspace_members`: thành viên của workspace và role ở cấp workspace
- `class_students`: học sinh thuộc class và role ở cấp class
- `sessions`: buổi học của class
- `attendances`: điểm danh của từng học sinh trong từng buổi học
- `assignments`: bài tập của session, gồm `manual` và `quiz`
- `submissions`: bài nộp file của từng học sinh cho từng `manual assignment`

## 4. Kiến trúc quyền hiện tại

### 4.1. Workspace role

Nguồn dữ liệu: `workspace_members.roleId`

Dùng cho các quyền ở cấp workspace như:

- tạo student trong workspace
- tạo, sửa, xóa class
- quản lý workspace custom roles
- quản lý chung trong workspace

System role hiện có ở cấp workspace:

- `owner`
- `admin`
- `teacher`
- `student`

### 4.2. Class role

Nguồn dữ liệu: `class_students.roleId`

Dùng cho các quyền ở cấp class như:

- xem session của class
- cập nhật attendance nếu được cấp quyền
- các module như `lecture`, `assignment`, `submission`

### 4.3. Class role mặc định `student`

Mỗi `class` luôn có một class role mặc định tên `student`.

Rule hiện tại:

- role này được tạo tự động khi tạo class
- nếu class cũ chưa có, hệ thống sẽ tự backfill
- mọi học sinh khi được thêm vào class sẽ tự được gán role này
- role mặc định `student` của class hiện có các permission:
  - `read:session`
  - `read:lecture`
  - `read:assignment`
- role mặc định này không được sửa hoặc xóa qua API
- nếu đổi role học sinh trong class về trạng thái mặc định, hệ thống sẽ gán lại role `student` của class thay vì để `null`

### 4.4. RBAC decorators hiện có

Hệ thống đang hỗ trợ:

- `@RequireRoles(...)`
- `@RequirePermission(...)`
- `@RequireAnyAccess([...])`

`@RequireAnyAccess([...])` dùng cho policy kiểu OR, ví dụ:

- `owner` của workspace
- hoặc class role có permission phù hợp

Ví dụ đang áp dụng:

- `GET /sessions/:sessionId/attendances`
  - `owner` của workspace chứa session đó
  - hoặc class role có `read:attendance`
- `PATCH /sessions/:sessionId/attendances/:studentId`
  - `owner` của workspace chứa session đó
  - hoặc class role có `update:attendance`

## 5. Auth và session management

Auth đang dùng cookie HTTP-only cho:

- `accessToken`
- `refreshToken`

Redis đang được dùng cho:

- lưu refresh session theo `jti`
- refresh token rotation
- revoke refresh session khi logout
- denylist access token ngắn hạn khi logout
- rate limit login theo `IP + userName`

Behavior hiện tại:

- login thành công sẽ tạo `accessToken` và `refreshToken`
- refresh token được lưu session trong Redis
- `POST /auth/refresh` sẽ rotate refresh token
- `POST /auth/logout` sẽ revoke refresh session và clear cookie
- access token bị logout sẽ vào denylist ngắn hạn để không dùng tiếp được ngay
- khi user bị disable (`isActive = false`):
  - access token cũ không dùng được nữa
  - refresh session bị revoke

## 6. Permission hệ thống đang seed

Các permission hiện có trong code:

- `read:workspace`
- `create:session`
- `read:session`
- `update:session`
- `delete:session`
- `read:attendance`
- `update:attendance`
- `create:lecture`
- `read:lecture`
- `update:lecture`
- `delete:lecture`
- `create:assignment`
- `read:assignment`
- `update:assignment`
- `delete:assignment`

Lưu ý:

- có permission trong DB không đồng nghĩa mọi API đều đang dùng permission đó
- một số API hiện vẫn cố ý khóa bằng role `owner`
- permission `lecture` và `assignment` đang được dùng thật trong các route đọc/ghi tương ứng

## 7. Trạng thái module hiện tại

### 7.1. Users

- đăng ký tài khoản teacher
- lấy profile hiện tại
- cập nhật profile hiện tại
- super admin xem danh sách user, xem chi tiết user, disable user

Lưu ý:

- `DELETE /users/:id` hiện là disable user (`isActive = false`), không phải xóa cứng
- hiện đang có cả `GET /auth/me` và `GET /users/me`

### 7.2. Workspaces

- tạo workspace
- xem chi tiết workspace
- tạo student trong workspace
- sửa thông tin student trong workspace
- xem danh sách student của workspace
- gỡ student khỏi workspace
- xem danh sách workspace user đang tham gia

### 7.3. Workspace Roles

- xem danh sách permission hệ thống
- xem custom role của workspace
- tạo custom role của workspace
- sửa custom role của workspace
- xóa custom role của workspace

### 7.4. Classes

- tạo class trong workspace
- xem danh sách class trong workspace
- xem chi tiết class
- xem roster của class
- thêm học sinh vào class
- sửa class
- xóa học sinh khỏi class
- xóa class
- đổi class role của học sinh

### 7.5. Class Roles

- xem danh sách custom role của class
- tạo custom role của class
- sửa custom role của class
- xóa custom role của class

### 7.6. Sessions

- tạo session cho class
- xem danh sách session của class
- xem chi tiết session
- sửa session
- xóa session

Policy hiện tại:

- `POST /classes/:classId/sessions`: `owner`
- `PATCH /sessions/:sessionId`: `owner`
- `DELETE /sessions/:sessionId`: `owner`
- `GET /classes/:classId/sessions`:
  - `owner`
  - hoặc class role có `read:session`
- `GET /sessions/:sessionId`:
  - `owner`
  - hoặc class role có `read:session`

### 7.7. Attendances

- xem roster điểm danh của session
- owner hoặc class role phù hợp có thể cập nhật điểm danh
- học sinh tự xem attendance của chính mình theo session
- học sinh tự check-in attendance của chính mình

### 7.8. Lectures

- lecture thuộc `session`
- lecture có thể gắn nhiều `materials`
- tạo, sửa, xóa lecture hiện là owner-only ở `workspace scope`
- xem lecture hiện là:
  - `owner`
  - hoặc class role có `read:lecture`
- tải file của lecture hiện đi qua route có auth:
  - `GET /lectures/:lectureId/materials/:materialId/download`

### 7.9. Materials

- `materials` là bảng file dùng chung
- quan hệ với lecture đi qua `lecture_materials`
- quan hệ với assignment đi qua `assignment_materials`
- upload file mới hiện đi qua multipart S3
- `materials` lưu record file chính
- `material_upload_sessions` lưu trạng thái multipart upload đang diễn ra
- material hiện có metadata S3 và `status`:
  - `bucket`
  - `objectKey`
  - `pending | ready | failed`
- chỉ material `ready` mới được attach vào lecture/assignment hoặc download
- owner của workspace upload, xem metadata, tải file, xóa file
- lecture và assignment không upload file trực tiếp, mà chỉ attach `materialIds`

### 7.10. Assignments

- assignment thuộc `session`
- assignment hiện có 2 loại:
  - `manual`
  - `quiz`
- assignment có thể gắn nhiều `materials`
- tạo, sửa, xóa assignment hiện là owner-only ở `workspace scope`
- xem assignment hiện là:
  - `owner`
  - hoặc class role có `read:assignment`
- tải file của assignment hiện đi qua route có auth:
  - `GET /assignments/:assignmentId/materials/:materialId/download`

### 7.11. Quiz Assignments

- quiz là một nhánh của `assignment`
- phase hiện tại chỉ hỗ trợ:
  - `single_choice`
  - mỗi học sinh `1 attempt`
- mỗi `quiz question` có thể có `materialId` nullable để gắn ảnh/audio/video/PDF nếu cần
- học sinh xem quiz qua class permission `read:assignment`
- owner quản lý toàn bộ question/option ở `workspace scope`
- sau khi học sinh submit:
  - hệ thống auto-grade ngay
  - lưu `score`, `maxScore`, `correctCount`
- sau khi đã có attempt:
  - owner không còn được sửa quiz content nữa

### 7.12. Submissions

- submission hiện chỉ áp dụng cho `manual assignment`
- submission là bài nộp file của **1 học sinh cho 1 manual assignment**
- mỗi học sinh chỉ có **1 submission cho mỗi manual assignment**
- nộp lại sẽ update bản ghi cũ, không tạo thêm submission mới
- file bài nộp được lưu qua bảng `materials` với category `submission`
- upload bài nộp hiện đi qua multipart S3:
  - `upload-init`
  - `upload-sign-part`
  - `upload-complete`
  - `upload-abort`
- lúc học sinh vừa nộp:
  - `grade = null`
  - `feedback = null`
- khi học sinh nộp lại trong cửa sổ `timeStart -> timeEnd`:
  - thay file nộp
  - cập nhật `submittedAt`
  - reset `grade` và `feedback` về `null`
- giáo viên review sau qua API riêng để cập nhật `grade` và `feedback`
- nếu ngoài cửa sổ `timeStart -> timeEnd` thì không được nộp bài nữa

Policy hiện tại:

- `GET /sessions/:sessionId/attendances`:
  - `owner`
  - hoặc class role có `read:attendance`
- `PATCH /sessions/:sessionId/attendances/:studentId`:
  - `owner`
  - hoặc class role có `update:attendance`
- `POST /sessions/:sessionId/attendances/me`:
  - chỉ cần đăng nhập
  - logic check ở service

## 8. Rule attendance hiện tại

### 8.1. Teacher hoặc owner cập nhật attendance

API:

- `PATCH /sessions/:sessionId/attendances/:studentId`

Policy:

- `owner` của workspace chứa session đó
- hoặc class role có `update:attendance`

### 8.2. Học sinh tự check-in

API:

- `POST /sessions/:sessionId/attendances/me`

Rule:

- phải là `student` account
- phải thuộc class của session đó
- trước hoặc đúng `timeStart` thì được ghi `present`
- sau `timeStart` nhưng trong `ATTENDANCE_SELF_CHECKIN_LATE_MINUTES` phút thì được ghi `late`
- quá cửa sổ trên thì bị từ chối
- nếu attendance đã bị giáo viên đánh `absent` thì học sinh không được tự ghi đè

## 9. Chạy local

### 9.1. Yêu cầu

- Node.js
- npm
- Docker

### 9.2. Biến môi trường Docker Compose ở root repo

File: `/.env`

Hiện dùng cho Docker Compose:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
POSTGRES_DB=edtech_db
POSTGRES_PORT=5432
REDIS_PORT=6379
```

### 9.3. Biến môi trường backend

File mẫu: `english-learning-be/.env.example`

Các nhóm biến hiện có:

```env
# Database
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

# Server
PORT=
NODE_ENV=

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

COOKIE_SECURE=
COOKIE_SAME_SITE=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_DB=

# Auth security
AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS=
AUTH_LOGIN_RATE_LIMIT_WINDOW=

# Attendance
ATTENDANCE_SELF_CHECKIN_LATE_MINUTES=
```

Ví dụ local phổ biến:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123456
DB_NAME=edtech_db

PORT=3000
NODE_ENV=development

JWT_SECRET=english_app_secret_key
JWT_REFRESH_SECRET=english_app_refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_LOGIN_RATE_LIMIT_WINDOW=15m

ATTENDANCE_SELF_CHECKIN_LATE_MINUTES=15
```

### 9.4. Chạy Postgres và Redis

Ở thư mục root của repo:

```bash
docker compose up -d
```

`docker-compose.yml` hiện có:

- `postgres`
- `redis`

### 9.5. Cài dependencies và chạy backend

Ở thư mục `english-learning-be`:

```bash
npm install
npm run start:dev
```

Lưu ý:

- nếu dùng S3 multipart upload, cần cấu hình thêm:
  - `S3_REGION`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_ENDPOINT`
  - `S3_FORCE_PATH_STYLE`
  - `S3_MULTIPART_PART_SIZE`
  - `S3_PRESIGNED_URL_EXPIRES_IN`
  - `S3_UPLOAD_SESSION_EXPIRES_IN`
  - `S3_MAX_UPLOAD_SIZE_BYTES`
  - `S3_MAX_MULTIPART_PARTS`
  - `S3_ALLOWED_MIME_TYPES`

### 9.6. Các lệnh thường dùng

```bash
npm run build
npm test -- --runInBand
npm run lint
```

## 10. Snapshot API hiện tại

### 10.1. System

- `GET /`

### 10.2. Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### 10.3. Users

- `POST /users/register`
- `GET /users`
- `GET /users/me`
- `GET /users/:id`
- `PATCH /users/me`
- `DELETE /users/:id`

### 10.4. Workspaces

- `POST /workspaces`
- `GET /workspaces/:id`
- `POST /workspaces/:id/students`
- `PATCH /workspaces/:id/students/:studentId`
- `GET /workspaces/:id/students`
- `DELETE /workspaces/:id/students/:studentId`
- `GET /workspaces/me`

### 10.5. Workspace Roles

- `GET /workspaces/:workspaceId/roles/permissions`
- `GET /workspaces/:workspaceId/roles`
- `POST /workspaces/:workspaceId/roles`
- `PATCH /workspaces/:workspaceId/roles/:roleId`
- `DELETE /workspaces/:workspaceId/roles/:roleId`

### 10.6. Classes

- `POST /workspaces/:workspaceId/classes`
- `GET /workspaces/:workspaceId/classes`
- `GET /classes/:classId`
- `GET /classes/:classId/students`
- `POST /classes/:classId/students`
- `PATCH /classes/:classId`
- `DELETE /classes/:classId/students/:studentId`
- `DELETE /classes/:classId`
- `PATCH /classes/:classId/students/:studentId/role`

### 10.7. Class Roles

- `GET /classes/:classId/roles`
- `POST /classes/:classId/roles`
- `PATCH /classes/:classId/roles/:roleId`
- `DELETE /classes/:classId/roles/:roleId`

### 10.8. Sessions

- `POST /classes/:classId/sessions`
- `GET /classes/:classId/sessions`
- `GET /sessions/:sessionId`
- `PATCH /sessions/:sessionId`
- `DELETE /sessions/:sessionId`

### 10.9. Attendances

- `GET /sessions/:sessionId/attendances`
- `PATCH /sessions/:sessionId/attendances/:studentId`
- `GET /sessions/:sessionId/attendances/me`
- `POST /sessions/:sessionId/attendances/me`

### 10.10. Lectures

- `POST /sessions/:sessionId/lectures`
- `GET /sessions/:sessionId/lectures`
- `GET /lectures/:lectureId`
- `GET /lectures/:lectureId/materials/:materialId/download`
- `PATCH /lectures/:lectureId`
- `DELETE /lectures/:lectureId`

### 10.11. Materials

- `POST /workspaces/:workspaceId/materials/upload-init`
- `POST /workspaces/:workspaceId/materials/upload-sign-part`
- `POST /workspaces/:workspaceId/materials/upload-complete`
- `POST /workspaces/:workspaceId/materials/upload-abort`
- `GET /workspaces/:workspaceId/materials`
- `GET /materials/:materialId`
- `GET /materials/:materialId/download`
- `DELETE /materials/:materialId`

### 10.12. Assignments

- `POST /sessions/:sessionId/assignments`
- `GET /sessions/:sessionId/assignments`
- `GET /assignments/:assignmentId`
- `GET /assignments/:assignmentId/materials/:materialId/download`
- `DELETE /assignments/:assignmentId`

### 10.13. Assignment Quizzes

- `GET /assignments/:assignmentId/quiz/manage`
- `GET /assignments/:assignmentId/quiz`
- `POST /assignments/:assignmentId/quiz/questions`
- `PATCH /assignments/:assignmentId/quiz/questions/:questionId`
- `DELETE /assignments/:assignmentId/quiz/questions/:questionId`
- `POST /assignments/:assignmentId/quiz/questions/:questionId/options`
- `PATCH /assignments/:assignmentId/quiz/options/:optionId`
- `DELETE /assignments/:assignmentId/quiz/options/:optionId`
- `GET /assignments/:assignmentId/quiz/questions/:questionId/materials/:materialId/download`
- `POST /assignments/:assignmentId/quiz/attempts/me/start`
- `GET /assignments/:assignmentId/quiz/attempts/me`
- `POST /assignments/:assignmentId/quiz/attempts/me/submit`
- `GET /assignments/:assignmentId/quiz/attempts`
- `GET /assignments/:assignmentId/quiz/attempts/:studentId`

### 10.14. Submissions

- `POST /assignments/:assignmentId/submissions/me/upload-init`
- `POST /assignments/:assignmentId/submissions/me/upload-sign-part`
- `POST /assignments/:assignmentId/submissions/me/upload-complete`
- `POST /assignments/:assignmentId/submissions/me/upload-abort`
- `GET /assignments/:assignmentId/submissions/me`
- `GET /assignments/:assignmentId/submissions/me/download`
- `GET /assignments/:assignmentId/submissions`
- `GET /assignments/:assignmentId/submissions/:studentId`
- `GET /assignments/:assignmentId/submissions/:studentId/download`
- `PATCH /assignments/:assignmentId/submissions/:studentId/review`

## 11. Guard summary hiện tại

### Public

- `GET /`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /users/register`

### `JwtRefreshGuard`

- `POST /auth/refresh`

### `JwtAuthGuard` only

- `GET /auth/me`
- `GET /users/me`
- `PATCH /users/me`
- `POST /workspaces`
- `GET /workspaces/me`
- `GET /sessions/:sessionId/attendances/me`
- `POST /sessions/:sessionId/attendances/me`

### `JwtAuthGuard + SuperAdminGuard`

- `GET /users`
- `GET /users/:id`
- `DELETE /users/:id`

### `JwtAuthGuard + RbacPermissionGuard + owner`

- tạo student trong workspace
- sửa student trong workspace
- list student của workspace
- remove student khỏi workspace
- workspace role CRUD
- material S3 multipart upload / list / detail / direct download / delete
- class CRUD
- class role CRUD
- tạo, sửa, xóa session
- tạo, sửa, xóa lecture
- tạo, sửa, xóa assignment

### `JwtAuthGuard + RbacPermissionGuard + owner OR class permission`

- xem danh sách session của class
- xem chi tiết session
- xem attendance roster của session
- cập nhật attendance của session
- xem danh sách lecture của session
- xem chi tiết lecture
- tải material của lecture
- xem danh sách assignment của session
- xem chi tiết assignment
- tải material của assignment

### `JwtAuthGuard + RbacPermissionGuard + permission`

- xem chi tiết workspace qua `read:workspace`
- khởi tạo multipart upload cho submission của chính mình qua `read:assignment`
- ký part upload cho submission của chính mình qua `read:assignment`
- complete multipart upload cho submission của chính mình qua `read:assignment`
- abort multipart upload cho submission của chính mình qua `read:assignment`
- xem submission của chính mình qua `read:assignment`
- tải submission của chính mình qua `read:assignment`

## 12. Hướng phát triển tiếp theo

Các phần hợp lý để làm tiếp theo:

1. mở rộng quiz sang `multiple_choice`, nhiều attempt, time limit nếu cần
2. `materials` metadata update API nếu cần
3. mở rộng policy permission cho teacher/class assistant ở nhiều route hơn nếu nghiệp vụ cần
