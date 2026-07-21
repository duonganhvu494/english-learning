# Scale lên 1000+ users

1000+ users là mức hoàn toàn trong tầm với stack hiện tại, nhưng backend cần được gia cố trước khi chạy production thật. Phần quan trọng không phải đổi framework, mà là bổ sung các lớp giúp hệ thống ổn định khi có nhiều request, file upload, notification và jobs chạy đồng thời.

## Mục tiêu

- Chạy được nhiều backend instances.
- Không mất data khi deploy.
- Upload/download file lớn không làm nghẽn backend.
- Query list/dashboard không chậm theo số lượng student/class/session.
- Notification/email/billing jobs có retry và không duplicate qua nhiều instance.
- Dev có thể deploy/migrate/rollback có kiểm soát.

## P0: Production safety

1. Database migrations

Hiện TypeORM đọc `database.synchronize` từ env. Trước production:

- Đặt `DB_SYNCHRONIZE=false`.
- Thêm TypeORM data source và migration scripts.
- Tạo migration từ schema hiện có.
- Biến seed plan/permission thành idempotent seed command hoặc migration.
- CI/CD phải chạy migration trước khi deploy app version mới.

2. Health/readiness

Thêm:

- `GET /health`: process alive.
- `GET /ready`: check PostgreSQL, Redis, S3 config/tối thiểu.
- Build metadata: app version, commit sha, env.

3. Index và pagination

Cần index cho các cột hay join/filter:

- `workspaceId`
- `classId`
- `sessionId`
- `assignmentId`
- `studentId`
- `userId`
- `createdAt`
- `dueAt`
- `status`

Tất cả list endpoint lớn nên có pagination:

- workspace students
- workspace classes
- class sessions
- class roster
- materials
- notifications
- assignment submissions
- quiz attempts

4. Logging và monitoring

Thêm:

- request id/correlation id.
- structured JSON logs.
- slow query logging.
- error tracking.
- metrics: request latency, error rate, DB pool, Redis latency, queue depth, job failures.

## P1: Multi-instance safe

1. Queue thay cho in-process side effects

Dùng BullMQ + Redis cho:

- email OTP/reset/temp password.
- notification fanout.
- assignment deadline reminders.
- billing renewals.
- upload cleanup.
- heavy exports.

Mỗi job cần:

- retry/backoff.
- idempotency key.
- dead-letter/failure logging.
- dashboard theo dõi queue.

2. Outbox pattern

Với event quan trọng như billing, submission, notification, nên có outbox table:

```text
business transaction
  -> save domain change
  -> save outbox event
worker
  -> publish/process outbox event
  -> mark processed
```

Làm vậy để tránh tình trạng DB save thành công nhưng notification/email fail mất dấu vết.

3. Distributed locks

Cron hiện chạy in-process. Nếu có 3 instances, job có thể chạy 3 lần. Cần:

- Redis lock.
- Queue repeatable jobs.
- Hoặc chỉ định worker deployment riêng.

## P2: Performance

1. Dashboard APIs

Không nên để FE tự gọi nhiều endpoint rồi tính dashboard. Nên thêm API aggregate:

- teacher dashboard summary.
- student dashboard summary.
- class detail summary.
- assignment analytics.

Sử dụng aggregate SQL, cache ngắn hạn nếu cần.

2. Avoid N+1

Khi list sessions/classes/assignments/submissions:

- Chọn fields cần thiết.
- Dùng query builder cho aggregate count.
- Tránh load relation sâu nếu response chỉ cần summary.

3. Cache có chủ đích

Nên cache:

- plans.
- permissions.
- workspace entitlement.
- unread count ngắn hạn nếu traffic cao.
- dashboard summary ngắn hạn.

Mỗi cache phải có invalidation rule rõ ràng.

## P3: Storage scale

Direct S3 upload hiện là hướng đúng. Cần bổ sung:

- lifecycle cleanup cho multipart uploads bị bỏ dở.
- quota per workspace.
- storage usage table/counter.
- signed URL TTL phù hợp.
- optional CDN cho download.
- virus scan pipeline nếu cho upload file mở rộng.

## P4: Security hardening

- Rate limit login/OTP/reset/upload-init.
- Lockout policy cho brute force.
- Audit log cho grade, attendance, role, billing, delete.
- Soft delete cho resource quan trọng.
- Security headers.
- CORS allowlist bắt buộc production.
- Không log secret/signed URL/password/OTP.
- Review temp password generation bằng crypto-safe random.

## P5: Product features nên thêm để thành SaaS tốt hơn

Nên ưu tiên các backend feature sau:

- Student onboarding: change password first login, invite link, bulk import.
- Student APIs: my classes, my assignments, upcoming sessions, progress.
- Teacher dashboard aggregate.
- Gradebook.
- Announcements/comments.
- Recurring sessions.
- Export attendance/submission/gradebook.
- Audit log.
- Real billing provider.
- Admin console nội bộ.

## Lộ trình đề xuất

Phase 1: hardening

- Migration, indexes, pagination.
- Health/readiness.
- Logging/request id.
- Upload cleanup.
- Rate limit critical endpoints.

Phase 2: async infrastructure

- BullMQ.
- Notification/email jobs.
- Billing job distributed-safe.
- Outbox cho event quan trọng.

Phase 3: product completion

- Student dashboard APIs.
- Gradebook.
- Quiz expansion.
- Export/report.
- Announcement/comment.

Phase 4: SaaS operations

- Stripe/Paddle.
- Admin console.
- Audit log.
- Plan enforcement đầy đủ.
- Monitoring dashboard.

