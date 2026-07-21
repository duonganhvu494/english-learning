# Tài liệu backend

Bộ tài liệu này được viết dựa trên source code hiện tại của `english-learning-be`. Mục tiêu là giúp dev mới nắm được backend đang làm gì, code được chia như thế nào, thêm tính năng nên bắt đầu từ đâu, và cần gia cố gì để đưa sản phẩm lên mức 1000+ users.

## Nên đọc theo thứ tự nào?

1. [01-system-overview.md](01-system-overview.md)
   Hiểu sản phẩm, domain, kiến trúc tổng quan và các luồng nghiệp vụ chính.

2. [02-module-guide.md](02-module-guide.md)
   Hiểu từng module backend, nhiệm vụ, entity, service/controller chính và các điểm cần cẩn thận khi sửa.

3. [03-api-map.md](03-api-map.md)
   Map nhanh các endpoint hiện có theo nhóm chức năng. File này hữu ích khi FE cần nối API hoặc dev cần trace controller.

4. [04-development-and-maintenance.md](04-development-and-maintenance.md)
   Quy ước phát triển, cách thêm feature mới, test, config, security, upload, notification và billing.

5. [05-scale-to-1000-users.md](05-scale-to-1000-users.md)
   Các việc cần làm để backend sẵn sàng cho 1000+ users: database migration, index, pagination, queue, observability, deployment.

6. [06-coding-conventions.md](06-coding-conventions.md)
   Quy ước đặt tên, cách tổ chức hàm, controller/service/DTO/entity conventions, error/transaction/event conventions và SOLID áp dụng thực dụng trong repo.

7. [agent-skill/SKILL.md](agent-skill/SKILL.md)
   Mẫu `SKILL.md` cho Codex/AI agent khi làm việc với backend này. Đây không phải docs cho end-user; nó là hướng dẫn ngắn gọn để agent đọc đúng file, tôn trọng domain boundary và validate đúng cách.

## Nên có những loại tài liệu nào?

Với codebase này, nên duy trì 4 lớp tài liệu:

1. Product/domain docs
   Giải thích hệ thống phục vụ ai, workspace/class/session/assignment/submission/billing có ý nghĩa gì, các luồng nghiệp vụ chính chạy ra sao.

2. Engineering docs
   Giải thích module, entity, API, auth, RBAC, storage, notification, billing, coding convention và cách thêm feature.

3. Operations docs
   Ghi rõ env, deployment, migration, backup, monitoring, queue, Redis, S3, scaling và incident checklist.

4. Agent skill docs
   `SKILL.md` để hướng dẫn AI agent làm việc trong repo. Skill nên ngắn, procedural, không lặp lại toàn bộ docs. Chỉ nên nói: đọc file nào trước, pattern nào bắt buộc theo, validation nào cần chạy, và cần tránh các lỗi nào.

## Khi nào cần cập nhật docs?

Cập nhật docs cùng PR khi thay đổi một trong các điểm sau:

- Thêm/sửa/xóa endpoint.
- Thêm/sửa entity hoặc relation.
- Đổi auth, RBAC, plan entitlement hoặc billing behavior.
- Đổi upload/download flow.
- Thêm background job, event listener hoặc realtime event.
- Đổi env var, docker, deployment, migration.
- Sửa logic nghiệp vụ quan trọng như attendance, quiz, submission review.

Nếu code thay đổi mà docs không đổi, dev tiếp theo sẽ đọc sai hệ thống. Đây là kiểu nợ kỹ thuật rất âm thầm, nhưng lại tính lãi đúng lúc đang release.
