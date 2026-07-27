# Coding conventions

Tài liệu này mô tả cách đặt tên, cách tổ chức hàm/class, và các nguyên tắc thiết kế khi code backend trong `english-learning-be`. Mục tiêu không phải làm code “đẹp cho vui”, mà là giúp dev khác đọc được nhanh, sửa ít vỡ, test được, và scale được khi sản phẩm lớn hơn.

## Nguyên tắc chung

- Code phải nói rõ nghiệp vụ trước, kỹ thuật sau.
- Controller mỏng, service chứa business rules.
- Không nhồi nhiều việc vào một hàm.
- Không trả raw entity nếu response cần contract ổn định.
- Không để workspace/class ownership check nằm mơ hồ.
- Không hard-code plan limit/permission ở nhiều nơi.
- Mỗi thay đổi quan trọng phải có test hoặc lý do rõ nếu chưa test được.

Một hàm tốt trong codebase này thường có nhịp:

1. Validate input ở DTO hoặc đầu service nếu là business validation.
2. Load resource cần thiết.
3. Check quyền/ownership/state.
4. Thực hiện thay đổi chính.
5. Emit event hoặc tạo side effect sau khi domain change rõ ràng.
6. Map sang response DTO.

## Naming conventions

### File và folder

Dùng kebab-case cho file/folder:

```text
create-assignment.dto.ts
assignment-response.dto.ts
workspace-entitlement.service.ts
assignment-deadline-notifications.job.ts
```

Theo pattern NestJS hiện có:

```text
<domain>.controller.ts
<domain>.service.ts
<domain>.module.ts
<domain>.entity.ts
<action-or-response>.dto.ts
<event-name>.event.ts
```

Ví dụ:

```text
sessions.controller.ts
sessions.service.ts
session.entity.ts
create-session.dto.ts
session-response.dto.ts
session-created.event.ts
```

### Class names

Dùng PascalCase:

```ts
export class AssignmentsService {}
export class CreateAssignmentDto {}
export class AssignmentResponseDto {}
export class AssignmentCreatedEvent {}
```

Tên class nên nói rõ vai trò:

- `*Controller`: nhận request, gọi service, wrap response.
- `*Service`: xử lý business logic.
- `*Dto`: request/response contract.
- `*Entity`: database model.
- `*Event`: domain event.
- `*Guard`: access/security guard.
- `*Job`: scheduled/background job.
- `*Listener`: lắng nghe event và tạo side effect.

### Function names

Dùng camelCase, bắt đầu bằng động từ:

```ts
createAssignment()
listSessionAssignments()
getAssignment()
updateAttendance()
reviewSubmission()
assertWorkspaceHasUsablePlan()
```

Quy ước động từ nên dùng:

- `create*`: tạo resource mới.
- `list*`: trả danh sách.
- `get*`: lấy một resource, nếu không có thì thường throw.
- `find*`: tìm resource, có thể trả `null`.
- `update*`: cập nhật một phần hoặc toàn bộ resource.
- `delete*`/`remove*`: xóa resource hoặc remove relation.
- `assert*`: kiểm tra điều kiện, fail thì throw.
- `ensure*`: đảm bảo trạng thái tồn tại hoặc tạo nếu thiếu.
- `build*`: dựng object/value thuần, không side effect.
- `map*`/`fromEntity`: chuyển entity sang DTO/shape khác.
- `emit*`: phát event.

Tránh tên mơ hồ:

```ts
// Không nên
handle()
process()
doUpdate()
check()
data()

// Nên
reviewSubmission()
processBillingRenewals()
assertCanAccessAssignment()
buildSubmissionResponse()
```

### Biến và tham số

Tên biến phải nói rõ entity hoặc id:

```ts
const workspace = await this.workspaceRepo.findOne(...);
const workspaceId = workspace.id;
const assignmentId = params.assignmentId;
const currentUserId = request.user.sub;
```

Không dùng tên quá chung trong service:

```ts
// Không nên
const data = ...
const item = ...
const result = ...

// Tạm chấp nhận trong scope rất ngắn, nhưng service lớn nên rõ hơn
const assignment = ...
const submission = ...
const updatedAttendance = ...
```

Với boolean, dùng tiền tố rõ nghĩa:

```ts
const isOwner = ...
const hasPermission = ...
const canSubmit = ...
const shouldNotifyStudents = ...
```

## Controller conventions

Controller chỉ nên làm các việc:

- Nhận params/query/body.
- Nhận user từ request.
- Gọi service.
- Trả `ApiResponse.success(...)`.
- Gắn guards, decorators (RBAC, validation).

Controller không nên:

- Query database trực tiếp.
- Chứa business rule dài.
- Tự tính permission phức tạp.
- Tự map entity sâu.

Pattern nên theo:

```ts
@Post('sessions/:sessionId/assignments')
async createAssignment(
  @Param('sessionId') sessionId: string,
  @Body() dto: CreateAssignmentDto,
  @Req() request: AuthenticatedRequest,
) {
  const assignment = await this.assignmentsService.createAssignment(
    sessionId,
    request.user.sub,
    dto,
  );

  return ApiResponse.success(assignment, 'Assignment created');
}
```

## Service conventions

Service là nơi business logic sống. Một service method nên đọc như một câu chuyện nghiệp vụ.

Pattern tốt:

```ts
async reviewSubmission(
  assignmentId: string,
  studentId: string,
  reviewerId: string,
  dto: ReviewSubmissionDto,
): Promise<SubmissionResponseDto> {
  const assignment = await this.getAssignmentOrThrow(assignmentId);
  const submission = await this.getStudentSubmissionOrThrow(assignmentId, studentId);

  this.assertAssignmentAcceptsReview(assignment);
  await this.assertReviewerCanReviewAssignment(reviewerId, assignment);

  submission.score = dto.score;
  submission.feedback = dto.feedback;
  submission.reviewedById = reviewerId;
  submission.reviewedAt = new Date();

  const savedSubmission = await this.submissionRepo.save(submission);
  this.eventEmitter.emit(...);

  return SubmissionResponseDto.fromEntity(savedSubmission);
}
```

Nếu một hàm service dài quá khoảng 60-80 dòng hoặc có nhiều nhánh `if`, nên tách helper private:

- `load*OrThrow`
- `assert*`
- `build*`
- `apply*`
- `emit*`

Không tách chỉ để tách. Tách khi tên helper làm business rule rõ hơn.

## DTO conventions

Request DTO:

- Tên theo action: `CreateClassDto`, `UpdateSessionDto`, `ReviewSubmissionDto`.
- Dùng `class-validator`.
- Không chứa logic nghiệp vụ nặng.
- Không expose field backend tự quyết như `id`, `createdAt`, `ownerId`, `reviewedById`.

Response DTO:

- Tên theo resource: `ClassResponseDto`, `SubmissionResponseDto`.
- Có static mapper nếu module đang dùng pattern đó:

```ts
static fromEntity(entity: Assignment): AssignmentResponseDto {
  return {
    id: entity.id,
    title: entity.title,
    type: entity.type,
  };
}
```

Không để FE phụ thuộc raw TypeORM entity, vì entity thay đổi vì database, còn response contract thay đổi vì API.

## Entity conventions

Entity là database model, không phải nơi chứa business flow phức tạp.

Nên:

- Đặt relation rõ ràng.
- Đặt index cho field hay query.
- Dùng enum cho state quan trọng.
- Có timestamp/audit fields nếu resource quan trọng.

Tránh:

- Method business dài trong entity.
- Expose sensitive fields ra response.
- Eager relation sâu không cần thiết.

## Error conventions

Ném exception có mã lỗi rõ ràng theo pattern hiện có của backend.

Một lỗi tốt nên trả lời được:

- Resource nào lỗi?
- Vì không tồn tại, không đủ quyền, sai state, hay sai input?
- FE có thể xử lý theo code/message không?

Ví dụ naming code:

```text
ASSIGNMENT_NOT_FOUND
SUBMISSION_ALREADY_REVIEWED
RBAC_PERMISSION_DENIED
WORKSPACE_PLAN_LIMIT_REACHED
AUTH_CSRF_INVALID
```

Tránh message quá kỹ thuật:

```text
Cannot read property id of undefined
Query failed
Invalid state
```

## Transaction conventions

Dùng transaction khi một nghiệp vụ thay đổi nhiều bảng hoặc có trạng thái phải nhất quán:

- Tạo workspace + membership + subscription.
- Add student vào class + role/class relation.
- Complete upload + update material/submission.
- Submit quiz attempt + attempt answers + score.
- Start billing subscription + payment transaction.

Không emit side effect quan trọng bên trong transaction nếu listener có thể fail hoặc đọc data chưa commit. Với production, nên dùng outbox pattern.

## Event và notification conventions

Event payload nên gọn:

```ts
export class AssignmentCreatedEvent {
  static readonly eventName = 'assignment.created';

  constructor(
    public readonly assignmentId: string,
    public readonly sessionId: string,
    public readonly classId: string,
    public readonly workspaceId: string,
  ) {}
}
```

Không nên nhét full entity lớn vào event nếu listener chỉ cần id. Listener có thể tự load dữ liệu cần thiết.

Notification nên:

- Có recipient rõ ràng.
- Có resource type/id.
- Tránh duplicate.
- Có thể chạy lại an toàn nếu job retry.

## SOLID áp dụng thực dụng

### Single Responsibility

Một class nên có một lý do chính để thay đổi.

Ví dụ:

- `MaterialsService` quản lý material lifecycle.
- `S3StorageService` chỉ biết nói chuyện với S3.
- `WorkspaceEntitlementService` chỉ tính quyền/limit theo plan.

Nếu service bắt đầu vừa xử lý billing, vừa gửi email, vừa tính permission, vừa upload S3, đó là dấu hiệu cần tách.

### Open/Closed

Khi thêm loại mới, hạn chế sửa nhiều nơi rải rác.

Ví dụ nếu mở rộng quiz question types:

- Tạo scoring strategy/helper theo type.
- Gom switch/case vào một nơi.
- Test từng type.

Không để `if type === ...` lặp lại trong controller, service, mapper, notification.

### Liskov Substitution

Ít dùng inheritance trong repo này. Nếu có interface/strategy, implementation phải thay thế được nhau mà không đổi caller.

Ví dụ payment provider thật sau này nên có interface kiểu:

```ts
interface PaymentProvider {
  createCheckoutSession(...): Promise<CheckoutSession>;
  handleWebhook(...): Promise<ProviderEventResult>;
}
```

`MockPaymentProvider` và `StripePaymentProvider` không nên bắt caller biết chi tiết riêng.

### Interface Segregation

Không tạo interface quá to.

Không nên:

```ts
interface LearningService {
  createAssignment(...): ...
  uploadMaterial(...): ...
  gradeSubmission(...): ...
  createBillingSubscription(...): ...
}
```

Nên tách theo domain nhỏ hơn:

- Assignment service.
- Material service.
- Submission service.
- Billing service.

### Dependency Inversion

Service nghiệp vụ nên phụ thuộc vào abstraction khi tích hợp ngoài có thể thay đổi:

- Storage provider.
- Payment provider.
- Mail provider.
- Queue publisher.

Hiện repo đã có `S3StorageService`. Khi mở rộng provider, cân nhắc interface để tránh business service dính trực tiếp vào SDK/provider.

## Clean code trong hàm

Một hàm nên ưu tiên thứ tự:

1. Guard clauses cho case lỗi.
2. Happy path đọc thẳng từ trên xuống dưới.
3. Tên biến rõ.
4. Ít nesting.
5. Side effect nằm cuối hoặc được đặt tên rõ.

Ví dụ nên dùng guard clause:

```ts
if (!assignment) {
  throw new NotFoundException(...);
}

if (!assignment.isOpen) {
  throw new BadRequestException(...);
}

return this.createSubmission(...);
```

Tránh nesting sâu:

```ts
if (assignment) {
  if (assignment.isOpen) {
    if (studentCanSubmit) {
      ...
    }
  }
}
```

## Comment conventions

Không comment điều hiển nhiên:

```ts
// Không cần
// Save the assignment
await this.assignmentRepo.save(assignment);
```

Chỉ comment khi có business rule hoặc trade-off không hiển nhiên:

```ts
// Late submissions are still stored so teachers can decide manually whether to grade them.
```

## Checklist review code

Khi review PR backend, hỏi nhanh:

- Endpoint có đúng auth/RBAC/plan guard không?
- Có leak dữ liệu ngoài workspace không?
- Có raw entity/sensitive field trả về FE không?
- List endpoint có pagination không?
- Query có nguy cơ N+1 không?
- Operation nhiều bảng có cần transaction không?
- Side effect có retry/idempotency không?
- Error code/message có đủ rõ không?
- Test có cover happy path và denied/error path không?
- Docs/API map có được cập nhật không?

