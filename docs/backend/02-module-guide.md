# Hướng dẫn theo module

File này giúp dev đọc nhanh từng module trong `english-learning-be/src`.

## App/common/config

`app.module.ts` load ConfigModule, TypeORM, EventEmitter, ScheduleModule và các business modules. `main.ts` cấu hình CORS, cookie parser, global ValidationPipe, exception filter, socket adapter và Swagger.

`common` chứa response envelope, exception filter, swagger decorators và utility chung. API response theo dạng:

```json
{
  "statusCode": 200,
  "message": "Message",
  "result": {}
}
```

Khi thêm endpoint mới, nên giữ response envelope nhất quán và dùng DTO response rõ ràng.

## Auth

Thư mục: `src/auth`

Nhiệm vụ:

- CSRF token.
- Login/logout/refresh.
- Email OTP verify/resend.
- Forgot/reset/change password.
- JWT strategies và guards.
- Redis-backed OTP/session/token state.
- Bắt user `mustChangePassword` đổi mật khẩu trước khi dùng các endpoint khác.

Cần chú ý:

- Write request cần CSRF token.
- Cookie security phụ thuộc `COOKIE_SECURE` và `COOKIE_SAME_SITE`.
- `JwtAuthGuard` có logic riêng cho `mustChangePassword`.
- Login/OTP/reset là nhóm cần rate limit nghiêm.

## Users

Thư mục: `src/users`

Nhiệm vụ:

- Teacher registration.
- User profile.
- Update profile.
- Super-admin list/get/delete user.
- Tạo student user qua workspace/class services.

Cần chú ý:

- Student provision flow gắn `mustChangePassword`.
- Temp password không nên log trong production.
- Khi thêm field user mới, cập nhật entity, DTO response, update DTO và test.

## Workspaces

Thư mục: `src/workspaces`

Nhiệm vụ:

- Tạo workspace.
- Lấy workspace của user.
- Quản lý student trong workspace.
- Seed/list plans.
- Workspace subscription và entitlement.
- Plan feature values.

Entities chính:

- `Workspace`
- `WorkspaceMember`
- `WorkspaceSubscription`
- `Plan`
- `PlanFeature`

Cần chú ý:

- Workspace là tenant boundary quan trọng nhất.
- Mỗi query có `workspaceId` phải đảm bảo user có access đúng workspace.
- Plan entitlement nên là nguồn sự thật khi check quota/feature.
- Tạo workspace + membership + subscription nên cần transaction nếu sửa tiếp.

## RBAC

Thư mục: `src/rbac`

Nhiệm vụ:

- Seed system permissions.
- System role permissions.
- Workspace custom roles.
- Class custom roles.
- Permission guards.
- Workspace plan guard.
- Redis cache.

Cần chú ý:

- Permission có format action/resource, ví dụ `read:assignment`.
- Guard cần biết scope: workspace, class, session, assignment, material.
- Khi thêm resource mới, phải thêm permission seed, mapping role mặc định, guard metadata, và docs API.
- Custom role có plan gating.

## Classes

Thư mục: `src/classes`

Nhiệm vụ:

- CRUD class.
- List classes theo workspace.
- Roster.
- Add/remove students.
- Tạo student trực tiếp trong class.
- Update class student role.

Cần chú ý:

- Class nằm dưới workspace.
- Student nằm trong workspace trước khi vào class.
- Quota class/student cần check qua entitlement.
- Add student vào class nên phát event để tạo notification.

## Sessions

Thư mục: `src/sessions`

Nhiệm vụ:

- CRUD session trong class.
- Generate sequential code.
- Emit event khi create/update/cancel/delete.

Cần chú ý:

- Session là parent scope cho attendance, lecture, assignment.
- Khi update/cancel session cần tạo notification.
- Recurring sessions chưa có, nếu thêm nên thiết kế riêng thay vì loop tạo nhiều record không có metadata.

## Attendances

Thư mục: `src/attendances`

Nhiệm vụ:

- Teacher xem attendance của session.
- Teacher update attendance từng student.
- Student xem attendance của mình.
- Student self check-in.

Cần chú ý:

- Self check-in cần có window rõ ràng để tránh check-in quá sớm/quá muộn.
- Khi sửa attendance cần audit log trong phiên bản production.
- Attendance rate nên dùng aggregate query khi làm dashboard.

## Materials

Thư mục: `src/materials`, `src/storage`

Nhiệm vụ:

- Init multipart upload.
- Sign upload part.
- Complete multipart upload.
- Abort upload.
- List/get/delete material.
- Signed download redirect.

Cần chú ý:

- Backend không nên proxy file lớn; client upload/download trực tiếp qua signed URL.
- Cần cleanup pending upload sessions.
- Cần storage quota theo workspace khi sản phẩm có 1000+ users.
- Khi delete DB record, cần quyết định chiến lược delete S3 object và recoverability.

## Lectures

Thư mục: `src/lectures`

Nhiệm vụ:

- CRUD lecture theo session.
- Attach materials.
- Download lecture material.
- Emit events cho notification.

Cần chú ý:

- Lecture material là relation tới reusable `Material`.
- Khi publish/change material cần thông báo student.
- Nên xác định lecture có draft/published state nếu mở rộng.

## Assignments

Thư mục: `src/assignments`

Nhiệm vụ:

- CRUD assignment cơ bản.
- Manual assignment.
- Quiz assignment.
- Schedule/open/due window.
- Attach material.
- Quiz question/option management.
- Quiz attempt start/get/submit/list.

Cần chú ý:

- Quiz có plan gating.
- Quiz attempt nên được transaction khi submit để tránh double-submit.
- Nếu thêm question types mới, cần update entity, DTO, scoring service và frontend contract.

## Submissions

Thư mục: `src/submissions`

Nhiệm vụ:

- Student manual submission upload multipart.
- Student get/download own submission.
- Teacher list/get/download submission.
- Teacher review/grade/feedback.
- Emit notification khi submit/review.

Cần chú ý:

- Upload flow phải complete mới coi là submitted.
- Review nên cần audit log khi production.
- Cần policy rõ cho resubmit, late submission và file replacement.

## Notifications

Thư mục: `src/notifications`

Nhiệm vụ:

- REST inbox.
- Unread count.
- Mark one/all read.
- Socket.IO gateway.
- Event listeners cho class/session/lecture/assignment/submission/attendance.
- Deadline/missed assignment cron.

Cần chú ý:

- EventEmitter hiện là in-process. Khi scale multi-instance, cần queue/outbox.
- Socket.IO cần Redis adapter nếu chạy hơn một instance.
- Notification nên có idempotency key để tránh duplicate.

## Billing

Thư mục: `src/billing`

Nhiệm vụ:

- Current billing subscription.
- Start paid subscription.
- Mock payment pay/fail.
- Cancel subscription at period end.
- Recurring renewal cron.

Cần chú ý:

- Provider hiện tại là mock.
- Khi tích hợp Stripe/Paddle, webhook phải idempotent.
- Entitlement nên đọc từ workspace subscription, không đọc trực tiếp từ payment transaction.
- Cron billing cần distributed lock/queue khi multi-instance.

