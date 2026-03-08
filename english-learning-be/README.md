# English Learning Backend

Backend NestJS cho nền tảng học tiếng Anh, sử dụng cơ chế phân quyền theo workspace.

## Phạm vi hiện tại

Các module đã có:

- `auth`
- `users`
- `workspaces`
- `rbac`
- `classes`
- `sessions`
- `attendances`

Cấu hình database hiện tại:

- PostgreSQL
- `autoLoadEntities: true`
- `synchronize: true`

Cấu hình này chỉ phù hợp cho môi trường local/dev. Đây không phải chiến lược migration cho production.

## Mô hình nghiệp vụ cốt lõi

Hệ thống đang đi theo hướng `workspace-first`.

Các rule nghiệp vụ đã chốt:

- Giáo viên phải tạo workspace trước.
- Học sinh được tạo bên trong một workspace cụ thể.
- Flow chính của sản phẩm không phải là "tạo học sinh trước, gán workspace sau".
- Mỗi workspace có tập học sinh riêng của nó.
- Sau này class sẽ chọn học sinh từ danh sách học sinh của workspace.
- Flow "tick chọn học sinh vào một nơi nào đó" thuộc về `class`, không phải `workspace`.

Thứ tự nghiệp vụ hợp lý:

1. `workspace`
2. `students in workspace`
3. `class in workspace`
4. `session in class`
5. `attendance in session`
6. `students assigned to class`

Ý nghĩa các bảng:

- `users`: thông tin tài khoản toàn cục
- `workspace_members`: user nào thuộc workspace nào, với workspace-level role gì
- `class_students`: học sinh nào của workspace thuộc class nào, và có thể có thêm class-level role riêng

## Mô hình tài khoản

`users.accountType` là thuộc tính toàn cục và hiện có:

- `teacher`
- `student`

Phân biệt quan trọng:

- `accountType` không phải là role trong workspace.
- Quyền trong workspace được xác định từ `workspace_members.roleId`.
- Nếu cần quyền riêng theo từng class, role đó nằm ở `class_students.roleId`.

Ví dụ:

- Cùng một user có thể là `teacher` ở workspace A và là `student_assistant` ở workspace B.
- Một student có thể là `student` ở cấp workspace, nhưng trong class Speaking A lại có thêm class role như `monitor`.

## Rule của workspace

Các rule hiện đã thống nhất:

- Chỉ tài khoản `teacher` mới được tạo workspace.
- Người tạo workspace sẽ trở thành owner của workspace đó.
- Người tạo workspace sẽ tự động được thêm vào `workspace_members` với system role `owner`.
- Ownership của workspace được dùng cho các API quản trị nhạy cảm trong workspace.

## Rule tạo học sinh

Hiện tại flow tạo student chính là:

- `POST /workspaces/:id/students`

API này là flow nên dùng vì backend xử lý trong một transaction:

- validate quyền sở hữu workspace
- tạo tài khoản student
- sinh mật khẩu tạm
- thêm student vào `workspace_members`
- gán system role `student`

## Mô hình RBAC

RBAC hiện tại là theo phạm vi workspace.

Chuỗi quan hệ:

`user -> workspace_member -> role -> role_permissions -> permission`

Ý nghĩa:

- User không cầm permission trực tiếp trong workspace.
- Role giữ permission.
- Membership là nơi gắn user với một role trong một workspace cụ thể.

### System roles

Các system role đang được seed:

- `owner`
- `admin`
- `teacher`
- `student`

### System permissions

Các permission đang được seed:

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

Chỉ các permission đã tồn tại trong bảng `permissions` mới có thể gán vào custom role.

Nếu sau này cần permission mới, phải seed thêm vào hệ thống trước.

### Custom roles

Custom role được hỗ trợ theo từng workspace.

Rule hiện tại:

- Custom role thuộc đúng một workspace thông qua `roles.workspaceId`
- `isSystem = false`
- Tên role phải unique trong cùng workspace
- Tên role không được trùng với tên system role đã reserve

Flow quản lý custom role hiện có:

- `GET /workspaces/:workspaceId/roles/permissions`
- `GET /workspaces/:workspaceId/roles`
- `POST /workspaces/:workspaceId/roles`

Các API này hiện đang bị giới hạn cho workspace owner và đồng thời check thêm owner đó phải có `accountType = teacher`.

### Class roles

Hệ thống hiện hỗ trợ thêm class-level role.

Rule hiện tại:

- `workspace_members.roleId` vẫn là nguồn sự thật cho quyền ở cấp workspace
- `class_students.roleId` là role bắt buộc ở cấp class, với mặc định là `student`
- Class role không thay thế workspace role, mà bổ sung thêm một scope riêng
- Custom class role được lưu trong cùng bảng `roles`, nhưng dùng `classId` thay vì `workspaceId`

Flow hiện có:

- `GET /classes/:classId/roles`
- `POST /classes/:classId/roles`
- `PATCH /classes/:classId/students/:studentId/role`

Lưu ý:

- Class role hiện đã có model dữ liệu và API quản lý
- Hạ tầng RBAC hiện đã hỗ trợ cả `workspace scope` và `class scope`
- Các endpoint quản trị class hiện tại vẫn explicit dùng `workspace scope`, vì owner đang được lưu ở `workspace_members`
- `class scope` được dành cho các API class-level/subresource về sau như `lecture`, `assignment`, ...

## Chiến lược guard

Xác thực:

- JWT được dùng cho các API bảo vệ thông qua `JwtAuthGuard`
- Auth hiện dùng cookie cho access token và refresh token

## Auth session với Redis

Phần auth hiện dùng Redis để quản lý refresh session thay vì chỉ dựa vào JWT thuần stateless.

Flow hiện tại:

- Khi `POST /auth/login`, backend sinh:
  - `accessToken`
  - `refreshToken`
  - `jti` riêng cho refresh session
- Refresh session được lưu vào Redis theo key:
  - `refresh:user:{userId}:{jti}`
- Mỗi user có thêm set index:
  - `refresh:user-sessions:{userId}`

Ý nghĩa:

- `accessToken` vẫn là JWT ngắn hạn cho request thường
- `refreshToken` chỉ hợp lệ khi:
  - JWT còn hạn và đúng chữ ký
  - user còn `isActive = true`
  - session `jti` còn tồn tại trong Redis

Các rule auth đã áp dụng:

- `POST /auth/refresh` sẽ rotate refresh token:
  - revoke session cũ
  - cấp `accessToken` mới
  - cấp `refreshToken` mới với `jti` mới
- `POST /auth/login` có rate limit bằng Redis theo tổ hợp `IP + userName`
- `POST /auth/logout` sẽ revoke refresh session hiện tại trong Redis nếu còn cookie hợp lệ
- `POST /auth/logout` đồng thời đưa `accessToken` hiện tại vào denylist ngắn hạn trong Redis đến lúc token hết hạn
- Khi user bị disable (`DELETE /users/:id`), backend revoke toàn bộ refresh session của user đó trong Redis
- `JwtStrategy` và `JwtRefreshStrategy` đều re-check user trong DB để chặn account đã bị disable

Phân quyền:

- `RbacPermissionGuard` là guard phân quyền chung cho nhiều scope
- Metadata được gắn bằng các decorator như `@RequireRoles(...)` và `@RequirePermission(...)`
- `hasPermission(...)` và `hasAnyRole(...)` đều nhận `scopeType`
- Guard hỗ trợ resolve scope gián tiếp, ví dụ `classId -> workspaceId`
- Các check ownership/business invariant dùng chung được gom vào `WorkspaceAccessService`

Rule scope đã chốt:

- `workspace role` chỉ áp cho các API quản trị ở cấp workspace
- `class role` áp cho các API class-level và các bảng con về sau như `lecture`, `assignment`, ...
- Các API quản trị class hiện tại vẫn explicit dùng `workspace scope` để owner của workspace quản lý lớp

Pattern đang dùng:

- `JwtAuthGuard` ở cấp class hoặc method
- `RbacPermissionGuard` ở cấp method
- RBAC decorator ở cấp method

Ví dụ:

```ts
@Post(':id/students')
@UseGuards(RbacPermissionGuard)
@RequireRoles(['owner'], {
  scopeType: 'workspace',
  scopeIdParam: 'id',
})
async createStudent(...) {}
```

Ví dụ route không có `workspaceId` trực tiếp:

```ts
@Post('classes/:classId/students')
@UseGuards(RbacPermissionGuard)
@RequireRoles(['owner'], {
  scopeType: 'workspace',
  scopeResourceType: 'class',
  scopeResourceIdParam: 'classId',
})
async addStudentsToClass(...) {}
```

## Ranh giới module

### `users`

Phụ trách các concern toàn cục liên quan đến account:

- đăng ký teacher
- lấy user
- cập nhật user
- xóa user

Module này không nên ôm các rule nghiệp vụ về membership trong workspace.

### `workspaces`

Phụ trách các flow nghiệp vụ theo workspace:

- tạo workspace
- tạo student trực tiếp trong workspace
- liệt kê học sinh của workspace
- liệt kê các workspace của user hiện tại

Đây là nơi phù hợp cho các flow kiểu "giáo viên thao tác khi đang đứng trong một workspace".

### `rbac`

Phụ trách:

- roles
- permissions
- ánh xạ role-permission
- check phân quyền
- các API quản lý custom role

### `classes`

Hiện đã có phần khởi tạo cơ bản.

Trách nhiệm hiện tại:

- liệt kê class của workspace
- lấy chi tiết class
- tạo class trong workspace
- cập nhật thông tin class
- lấy roster học sinh trong class
- thêm học sinh của workspace vào class
- xóa học sinh khỏi class
- xóa class
- gán hoặc đổi class-level role cho học sinh trong class

### `sessions`

Phụ trách các buổi học của từng class.

Trách nhiệm hiện tại:

- tạo session trong class
- liệt kê session của class
- lấy chi tiết một session
- cập nhật thông tin session
- xóa session

Rule hiện tại:

- `session` là thực thể con của `class`
- các API quản trị `session` hiện vẫn dùng `workspace scope`
- `sessionId` có thể được resolve về `workspaceId` hoặc `classId` thông qua `WorkspaceAccessService`

### `attendances`

Phụ trách điểm danh cho từng buổi học (`session`).

Trách nhiệm hiện tại:

- lấy danh sách điểm danh của một session
- cập nhật trạng thái điểm danh cho từng học sinh trong session
- cho học sinh tự check-in điểm danh của chính mình

Rule hiện tại:

- `attendance` thuộc về `session`
- chỉ học sinh đã thuộc class của session mới được điểm danh
- các API quản trị attendance hiện vẫn dùng `workspace scope` resolve từ `sessionId`
- self check-in của học sinh:
  - trước hoặc đúng `timeStart` -> `present`
  - sau `timeStart` nhưng trong `ATTENDANCE_SELF_CHECKIN_LATE_MINUTES` phút -> `late`
  - quá cửa sổ trên -> không cho self check-in nữa
- trạng thái hợp lệ hiện có:
  - `present`
  - `absent`
  - `late`

## Snapshot API hiện tại

Toàn bộ endpoint đang có trong source code hiện tại:

### System

- `GET /`
  - route health/demo mặc định từ `AppController`

### Auth

- `POST /auth/login`
  - public
  - đăng nhập bằng `userName` và `password`
  - chỉ cho phép account `isActive = true`
  - có rate limit bằng Redis theo `IP + userName`
  - set `accessToken` và `refreshToken` vào cookie
  - lưu refresh session vào Redis
- `POST /auth/refresh`
  - cần `JwtRefreshGuard`
  - chỉ chấp nhận refresh token còn session trong Redis
  - rotate refresh token và refresh access token
- `POST /auth/logout`
  - public
  - revoke refresh session hiện tại trong Redis nếu có
  - đưa access token hiện tại vào denylist Redis đến lúc token hết hạn
  - xóa cookie auth
- `GET /auth/me`
  - cần `JwtAuthGuard`
  - trả thông tin user hiện tại

### Users

- `POST /users/register`
  - public
  - tạo tài khoản teacher
- `GET /users`
  - cần `JwtAuthGuard`
  - cần `SuperAdminGuard`
  - lấy toàn bộ user
- `GET /users/me`
  - cần `JwtAuthGuard`
  - lấy profile của user hiện tại
- `GET /users/:id`
  - cần `JwtAuthGuard`
  - cần `SuperAdminGuard`
  - lấy chi tiết một user
- `PATCH /users/me`
  - cần `JwtAuthGuard`
  - user tự cập nhật profile của chính mình
  - hiện chỉ cho sửa `fullName`, `userName`, `email`
- `DELETE /users/:id`
  - cần `JwtAuthGuard`
  - cần `SuperAdminGuard`
  - tạm thời disable user bằng cách set `isActive = false`
  - revoke toàn bộ refresh session của user đó trong Redis

### Workspaces

- `POST /workspaces`
  - cần `JwtAuthGuard`
  - chỉ teacher account mới tạo được workspace
- `POST /workspaces/:id/students`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - tạo student mới và add luôn vào workspace
- `GET /workspaces/:id/students`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - lấy danh sách student của workspace
- `DELETE /workspaces/:id/students/:studentId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - bỏ học sinh khỏi workspace
  - đồng thời xóa mọi quan hệ `class_students` của học sinh đó trong các class thuộc workspace
- `GET /workspaces/me`
  - cần `JwtAuthGuard`
  - lấy danh sách workspace mà user hiện tại đang là member

### RBAC

- `GET /workspaces/:workspaceId/roles/permissions`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - lấy danh sách permission đang có trong hệ thống
- `GET /workspaces/:workspaceId/roles`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - lấy danh sách custom role của workspace
- `POST /workspaces/:workspaceId/roles`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - tạo custom role cho workspace
- `PATCH /workspaces/:workspaceId/roles/:roleId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - sửa `name`, `description`, `permissionKeys` của custom role workspace
- `DELETE /workspaces/:workspaceId/roles/:roleId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - xóa custom role của workspace
  - bị chặn nếu role vẫn đang được gán cho `workspace_members`
- `GET /classes/:classId/roles`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - lấy danh sách custom role của class
- `POST /classes/:classId/roles`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - tạo custom role cho class
- `PATCH /classes/:classId/roles/:roleId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - sửa `name`, `description`, `permissionKeys` của custom role class
- `DELETE /classes/:classId/roles/:roleId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - xóa custom role của class
  - bị chặn nếu role vẫn đang được gán cho `class_students`

### Classes

- `GET /workspaces/:workspaceId/classes`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - lấy danh sách class của workspace, kèm `studentCount`
- `GET /classes/:classId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - lấy chi tiết class gồm `id`, `className`, `description`, `workspaceId`, `studentCount`
- `POST /workspaces/:workspaceId/classes`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` trong workspace đó
  - tạo class trong workspace
- `PATCH /classes/:classId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - sửa `className` và/hoặc `description` của class
- `GET /classes/:classId/students`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - lấy roster học sinh hiện tại của class, kèm class role nếu có
- `POST /classes/:classId/students`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - thêm dần student vào class
- `DELETE /classes/:classId/students/:studentId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - xóa cứng một học sinh khỏi class
- `DELETE /classes/:classId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - xóa cứng class và toàn bộ quan hệ `class_students` của class đó
- `PATCH /classes/:classId/students/:studentId/role`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - gán, đổi, hoặc clear class-level role cho một học sinh trong class

### Class default role

Mỗi `class` có một class role mặc định tên `student`.

Rule hiện tại:

- role này được tạo tự động khi tạo class hoặc khi hệ thống phát hiện class cũ chưa có
- mọi học sinh khi được thêm vào class sẽ tự được gán role mặc định này
- role mặc định `student` của class có permission cơ bản:
  - `read:session`
- role mặc định này không được sửa hoặc xóa qua API class role

### Sessions

- `POST /classes/:classId/sessions`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa class đó
  - tạo session mới cho class
- `GET /classes/:classId/sessions`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cho phép:
    - `owner` của workspace chứa class đó
    - hoặc role của class có permission `read:session`
  - lấy danh sách session của class
- `GET /sessions/:sessionId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cho phép:
    - `owner` của workspace chứa session đó
    - hoặc role của class chứa session có permission `read:session`
  - lấy chi tiết session
- `PATCH /sessions/:sessionId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa session đó
  - cập nhật `timeStart`, `timeEnd`, `topic`
- `DELETE /sessions/:sessionId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cần role `owner` của workspace chứa session đó
  - xóa cứng session

### Attendances

- `GET /sessions/:sessionId/attendances`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cho phép:
    - `owner` của workspace chứa session đó
    - hoặc role của class có permission `read:attendance`
  - lấy roster điểm danh của session, gồm toàn bộ học sinh của class kèm trạng thái hiện tại
- `PATCH /sessions/:sessionId/attendances/:studentId`
  - cần `JwtAuthGuard`
  - cần `RbacPermissionGuard`
  - cho phép:
    - `owner` của workspace chứa session đó
    - hoặc role của class có permission `update:attendance`
  - tạo mới hoặc cập nhật trạng thái điểm danh của một học sinh trong session
- `POST /sessions/:sessionId/attendances/me`
  - cần `JwtAuthGuard`
  - học sinh tự điểm danh chính mình trong session
  - chỉ chấp nhận user là student đã thuộc class của session
  - trước hoặc đúng giờ học sẽ ghi `present`
  - trễ trong `ATTENDANCE_SELF_CHECKIN_LATE_MINUTES` phút sẽ tự ghi `late`
  - quá cửa sổ trễ thì bị từ chối

## Các quyết định sản phẩm đã chốt

Các quyết định dưới đây đã được thống nhất và code về sau nên bám theo:

- Flow chính của hệ thống là `workspace-first`.
- Việc tạo student nên diễn ra khi đang ở trong một workspace cụ thể.
- Không còn duy trì flow `create student standalone` ở backend.
- Workspace là nguồn dữ liệu gốc cho tập học sinh.
- Sau này class sẽ chọn học sinh từ danh sách học sinh của workspace.
- Ownership của workspace có độ ưu tiên cao hơn teacher membership thông thường với các thao tác quản trị nhạy cảm.

## Bộ API đã chốt

### `POST /workspaces`

Tạo workspace cho teacher. Đây là điểm bắt đầu của toàn bộ flow nghiệp vụ.

### `POST /workspaces/:workspaceId/students`

Tạo student mới bên trong workspace đã chọn. Backend phải vừa tạo `user` vừa thêm vào `workspace_members`.

### `GET /workspaces/:workspaceId/students`

Lấy danh sách học sinh của một workspace. Đây sẽ là nguồn dữ liệu để các màn class chọn học sinh.

### `POST /workspaces/:workspaceId/classes`

Tạo class trong một workspace cụ thể. Class luôn là thực thể con của workspace.

### `POST /classes/:classId/students`

Gán học sinh của workspace vào class.

API này hiện theo kiểu thêm dần, không đồng bộ toàn bộ roster.

### `DELETE /classes/:classId/students/:studentId`

Xóa một học sinh ra khỏi class.

### `DELETE /classes/:classId`

Xóa class.

Hiện tại đang implement theo kiểu xóa cứng vì schema chưa có `deletedAt` hoặc cờ soft-delete cho `classes` và `class_students`.

## Chạy dự án

Cài package:

```bash
npm install
```

Chạy local:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Test:

```bash
npm test -- --runInBand
```

## Biến môi trường bổ sung

Auth session hiện cần thêm Redis:

```env
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_DB=
AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS=
AUTH_LOGIN_RATE_LIMIT_WINDOW=
```

## Ghi chú cho các bước tiếp theo

Các bước backend có khả năng sẽ làm tiếp:

- implement add/remove student vào class
- implement API đọc danh sách class và danh sách học sinh của từng class
- mở rộng system permissions thay vì chỉ có 2 permission như hiện tại
- review lại và giảm dần các low-level API đang xung đột với hướng `workspace-first`
