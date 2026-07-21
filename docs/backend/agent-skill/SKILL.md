---
name: english-learning-backend
description: Làm việc với backend NestJS của english-learning. Dùng khi cần thay đổi, review, viết tài liệu hoặc mở rộng backend trong english-learning-be, đặc biệt là auth, workspace, RBAC, classes, sessions, attendance, materials, lectures, assignments, submissions, notifications, billing, database migrations hoặc production hardening.
---

# English Learning Backend

Dùng skill này khi làm việc với `english-learning-be`.

## Các file cần đọc trước

Đọc các file này trước khi làm thay đổi backend không tầm thường:

1. `docs/backend/README.md`
2. `docs/backend/01-system-overview.md`
3. `docs/backend/02-module-guide.md`
4. `docs/backend/06-coding-conventions.md`
5. Controller, service, DTOs, entities và specs của module cần sửa.

Nếu làm việc với endpoint, đọc thêm `docs/backend/03-api-map.md`.

Nếu làm việc với scale, deployment, queue, migration hoặc production, đọc thêm `docs/backend/05-scale-to-1000-users.md`.

## Quy ước repo

- Giữ controller mỏng.
- Đặt business rules trong service.
- Dùng request và response DTOs; tránh trả raw entities cho response phức tạp.
- Giữ API response envelope hiện có.
- Giữ workspace/class/session ownership checks rõ ràng.
- Dùng RBAC và plan guards cho các workspace-scoped features.
- Dùng S3 presigned multipart upload cho file lớn; không proxy large uploads qua NestJS.
- Xem notification, email, billing và cleanup là async side effects khi cần production safety.

## Backend boundaries

Workspace là tenant boundary. Trước khi thêm hoặc sửa feature, xác định:

- Resource thuộc workspace nào?
- Role/permission nào được yêu cầu?
- Student có chỉ được truy cập resource của chính mình không?
- Feature này có tiêu tốn plan entitlement hoặc quota không?
- Operation có cần event, notification, audit log hoặc background job không?

## Checklist phát triển

Khi thêm endpoint:

1. Thêm hoặc cập nhật DTOs.
2. Thêm service logic.
3. Thêm controller method.
4. Thêm guards và permission metadata.
5. Thêm tests cho success path và denied access.
6. Cập nhật `docs/backend/03-api-map.md`.

Khi thêm thay đổi data model:

1. Cập nhật entity.
2. Cập nhật DTOs và mappers.
3. Thêm migration khi migrations đã được bật.
4. Thêm indexes cho các filter và joins phổ biến.
5. Cập nhật tests và docs.

## Validation

Dùng validation hẹp nhất nhưng đủ tin cậy trước:

```bash
cd english-learning-be
npm run build
npm test -- --runInBand
```

Với auth, RBAC, guards, entity relations hoặc shared utilities, chạy full backend test suite.

## Rủi ro thường gặp

- Không bật `DB_SYNCHRONIZE=true` trong production.
- Không log OTPs, passwords, tokens, temp passwords, secrets hoặc signed URLs.
- Không thêm list endpoints thiếu pagination khi dữ liệu có thể tăng lớn.
- Không thêm workspace-scoped endpoints thiếu access checks.
- Không để in-process cron/event behavior là nguồn sự thật duy nhất cho production-critical side effects.
