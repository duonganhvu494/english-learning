# Hướng dẫn phát triển và bảo trì

Tài liệu này dành cho dev cần thêm/sửa backend feature.

## Nguyên tắc đọc code

1. Bắt đầu từ controller để biết public API.
2. Đọc DTO request/response để biết contract.
3. Đọc service để hiểu rule nghiệp vụ.
4. Đọc entity để hiểu data model và relation.
5. Đọc guard/listener/job liên quan nếu endpoint có auth/RBAC/event side effect.
6. Đọc spec gần module trước khi sửa logic.

## Khi thêm endpoint mới

Làm theo checklist:

- Tạo DTO request nếu có body/query.
- Tạo DTO response, không trả raw entity nếu response phức tạp.
- Thêm method vào service trước, controller chỉ nên mỏng.
- Gắn `JwtAuthGuard`/RBAC/plan guard phù hợp.
- Kiểm tra workspace/class/session ownership boundary.
- Dùng response envelope hiện có.
- Thêm unit test cho service và controller.
- Cập nhật `docs/backend/03-api-map.md`.

## Khi thêm entity hoặc field mới

Checklist:

- Cập nhật entity TypeORM.
- Cập nhật DTO response.
- Cập nhật create/update DTO nếu field là input.
- Cập nhật mapper `fromEntity` nếu có.
- Thêm migration khi đã chuyển sang production migration flow.
- Thêm index nếu field dùng để filter/join/sort.
- Cập nhật test fixture.
- Cập nhật docs domain/module.

## Auth và security

Backend dùng cookie HTTP-only + CSRF. Request ghi dữ liệu cần CSRF token. Khi thêm route:

- Route đọc dữ liệu có thể là GET và không cần CSRF.
- Route ghi dữ liệu phải qua CSRF middleware.
- Endpoint nhạy cảm như login, OTP, reset password, upload-init nên có rate limit.
- Không log OTP, password, temp password, token, signed URL trong production.
- Khi xử lý `mustChangePassword`, chỉ cho phép user vào các endpoint cần thiết để đổi password và xem thông tin tối thiểu.

## RBAC và tenant boundary

Mỗi feature nằm trong workspace phải trả lời được:

- User có thuộc workspace này không?
- Role workspace/class của user là gì?
- Permission action/resource nào được yêu cầu?
- Resource này suy ra workspaceId từ đâu?
- Student có đang truy cập dữ liệu của chính mình hay của người khác?

Khi thêm resource mới, cần thêm:

- Permission seed trong RBAC service.
- Role permission mapping mặc định.
- Guard metadata trên controller.
- Test permission denied.
- Docs API và module guide.

## Upload/download

Material và submission upload theo S3 multipart flow:

1. `upload-init`
2. `upload-sign-part`
3. Client upload thẳng lên S3.
4. `upload-complete`
5. Backend mark ready/submitted.
6. Download qua signed URL redirect.

Khi sửa upload:

- Không đưa file lớn đi qua backend.
- Validate MIME type, size, number of parts.
- Check ownership của upload session.
- Đảm bảo complete/abort idempotent nhất có thể.
- Định nghĩa cleanup cho pending sessions.
- Cập nhật storage quota nếu có.

## Events, notifications và jobs

Nhiều service emit event để tạo notification:

- Class student added.
- Session created/updated/cancelled.
- Lecture created/materials published.
- Assignment created/materials published.
- Submission created/reviewed.
- Attendance updated.

Hiện tại EventEmitter và Cron chạy in-process. Khi sản phẩm scale nhiều instance, nên chuyển các side effects sang queue/outbox.

Quy tắc khi thêm event:

- Event payload nên có resource ids, không cần nhét full entity lớn.
- Listener nên idempotent nếu có thể.
- Notification nên tránh duplicate.
- Email/socket side effect nên đi qua queue khi production.

## Billing và entitlement

Billing hiện là mock provider nhưng domain đã tách subscription và transaction.

Khi thêm paid feature:

- Thêm `PlanFeature`.
- Update seed plan.
- Update entitlement service.
- Thêm plan guard nếu là route-level feature.
- Thêm test cho free/paid plan.
- Cập nhật docs plan.

Khi tích hợp payment provider thật:

- Webhook phải idempotent.
- Lưu provider event id.
- Không tin client callback làm nguồn sự thật.
- Subscription state nên là nguồn chính cho entitlement.

## Testing

Lệnh thường dùng:

```bash
cd english-learning-be
npm run build
npm test -- --runInBand
npm run test:e2e
```

Khi sửa logic module nào, chạy spec module đó trước. Khi sửa shared guard/auth/RBAC/entity relation, chạy full test.

Hiện backend có unit test khá nhiều, nhưng e2e còn mỏng. Nếu thêm luồng nghiệp vụ quan trọng, nên thêm e2e cho happy path và permission denied path.

## Những việc cần tránh

- Không bật `DB_SYNCHRONIZE=true` trong production.
- Không trả raw entity có relation sâu hoặc sensitive field.
- Không query list lớn mà không pagination.
- Không tạo notification/email trực tiếp trong transaction nếu side effect có thể fail.
- Không hard-code plan limit trong nhiều module; dùng entitlement service.
- Không thêm endpoint workspace-scoped mà thiếu workspace access check.

