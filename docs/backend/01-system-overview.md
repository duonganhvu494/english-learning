# Tổng quan hệ thống

`english-learning-be` là backend NestJS cho một nền tảng quản lý lớp học tiếng Anh theo mô hình SaaS. Hệ thống xoay quanh `workspace`: mỗi giáo viên/trung tâm có workspace, trong workspace có students, classes, sessions, materials, assignments, submissions, roles, plans và billing.

## Tech stack

- NestJS 11 + TypeScript.
- PostgreSQL + TypeORM.
- Redis cho OTP, refresh session, token denylist và RBAC cache.
- S3-compatible storage cho file material/submission.
- Socket.IO cho realtime notifications.
- Markdown API reference ở `docs/backend/03-api-map.md`.
- EventEmitter và Schedule/Cron cho notification/billing jobs.

Entry points quan trọng:

- `english-learning-be/src/main.ts`: bootstrap app, CORS, cookie parser, validation pipe, exception filter, socket adapter.
- `english-learning-be/src/app.module.ts`: load config, TypeORM, EventEmitter, ScheduleModule, và toàn bộ business modules.
- `english-learning-be/src/config`: env/config theo nhóm database, app, jwt, redis, mail, storage.

## Domain model ngắn gọn

Luồng domain chính:

```text
User
  -> WorkspaceMember
  -> Workspace
  -> Class
  -> ClassStudent
  -> Session
  -> Attendance
  -> Lecture -> LectureMaterial -> Material
  -> Assignment -> AssignmentMaterial -> Material
  -> Submission
  -> QuizQuestion -> QuizOption -> QuizAttempt
```

Billing và entitlement nằm theo workspace:

```text
Workspace
  -> WorkspaceSubscription
  -> Plan
  -> PlanFeature

BillingSubscription
  -> PaymentTransaction
```

RBAC có hai scope:

- Workspace scope: owner/admin/teacher/student/custom workspace role.
- Class scope: class-level role cho student trong một lớp.

## Luồng nghiệp vụ chính

1. Teacher đăng ký tài khoản qua `POST /users/register`.
2. Teacher verify email bằng OTP.
3. Teacher login qua `POST /auth/login`.
4. Teacher tạo workspace hoặc lấy workspace hiện có.
5. Workspace được gán free subscription/plan mặc định.
6. Teacher tạo students trong workspace.
7. Teacher tạo class và add students vào class.
8. Teacher tạo sessions trong class.
9. Trong mỗi session, teacher có thể điểm danh, tạo lecture, gắn materials, tạo assignment.
10. Student xem class/session/lecture/assignment và nộp bài hoặc làm quiz.
11. Teacher review submission/quiz attempt.
12. Notification được tạo từ event và có thể đẩy qua WebSocket.
13. Billing/plan enforcement giới hạn quota và feature theo workspace.

## Những chức năng backend đã có

- Auth cookie-based: access token, refresh token, CSRF, logout/revoke, forgot/reset/change password.
- Email verification OTP.
- Workspace, workspace students, plans, subscription.
- Classes, class roster, class-level roles.
- Sessions.
- Attendances: teacher update và student self check-in.
- Materials: S3 multipart upload, signed download, delete.
- Lectures: CRUD, attach material, signed download.
- Assignments: manual/quiz, attach material, schedule window, delete.
- Submissions: multipart upload, list, download, review/grade.
- Quiz: question/option CRUD, student attempts, auto-grade, teacher review attempts.
- RBAC: permission, workspace roles, class roles, guards, plan guard.
- Notifications: REST inbox, unread count, mark read, mark all, realtime gateway, event listeners, cron reminders.
- Billing: mock subscription, mock payment transaction, cancel at period end, recurring cron.

## Điểm đang là MVP, cần gia cố trước production

- Database chưa có migration; TypeORM đang dựa vào `synchronize` qua env.
- In-process EventEmitter/Cron chưa phù hợp khi chạy nhiều backend instances.
- Chưa có queue/outbox cho email, notification, billing, cleanup upload.
- Chưa thấy global pagination strategy cho tất cả list endpoint lớn.
- Chưa có structured logging/metrics/request id.
- Billing provider hiện là mock.
- Mail fallback có thể log nội dung nhạy cảm nếu cấu hình SMTP thiếu.
- Upload multipart cần cleanup pending/aborted sessions.
