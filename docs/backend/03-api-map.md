# API map

Backend hiện không dùng global prefix. Các path dưới đây là path trực tiếp từ controller.

## App

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/` | Hello World endpoint, chưa phải healthcheck production |

## Health

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/health` | Liveness check: process NestJS còn sống |
| GET | `/ready` | Readiness check: PostgreSQL, Redis và S3 config tối thiểu sẵn sàng |

## Auth

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/auth/csrf-token` | Lấy CSRF token |
| POST | `/auth/login` | Login, set auth cookies |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Logout/revoke session |
| GET | `/auth/me` | Lấy auth user hiện tại |
| POST | `/auth/verify-email-otp` | Verify email OTP |
| POST | `/auth/resend-email-otp` | Gửi lại OTP |
| POST | `/auth/forgot-password` | Tạo reset password challenge |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/change-password` | Đổi password, dùng cho `mustChangePassword` |

## Users

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/users/register` | Đăng ký teacher |
| GET | `/users` | Super admin list users |
| GET | `/users/me` | Lấy profile hiện tại |
| GET | `/users/:id` | Super admin get user |
| PATCH | `/users/me` | Update profile |
| DELETE | `/users/:id` | Super admin disable/delete user |

## Workspaces

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/workspaces` | Tạo workspace |
| GET | `/workspaces/me` | Lấy workspace hiện tại |
| GET | `/workspaces/me/subscription` | Current workspace subscription |
| GET | `/workspaces/plans` | List plans |
| GET | `/workspaces/:id` | Workspace detail |
| POST | `/workspaces/:id/students` | Tạo student trong workspace |
| GET | `/workspaces/:id/students` | List students |
| PATCH | `/workspaces/:id/students/:studentId` | Update student |
| DELETE | `/workspaces/:id/students/:studentId` | Remove student khỏi workspace |

## Workspace roles

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/workspaces/:workspaceId/roles/permissions` | List permissions |
| GET | `/workspaces/:workspaceId/roles` | List workspace roles |
| POST | `/workspaces/:workspaceId/roles` | Create custom workspace role |
| PATCH | `/workspaces/:workspaceId/roles/:roleId` | Update custom workspace role |
| DELETE | `/workspaces/:workspaceId/roles/:roleId` | Delete custom workspace role |

## Classes

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/workspaces/:workspaceId/classes` | Tạo class |
| GET | `/workspaces/:workspaceId/classes` | List classes |
| GET | `/classes/:classId` | Class detail |
| GET | `/classes/:classId/students` | Class roster |
| POST | `/classes/:classId/students` | Add existing students vào class |
| POST | `/classes/:classId/students/create` | Tạo student và add vào class |
| PATCH | `/classes/:classId` | Update class |
| DELETE | `/classes/:classId/students/:studentId` | Remove student khỏi class |
| DELETE | `/classes/:classId` | Delete class |
| PATCH | `/classes/:classId/students/:studentId/role` | Update class student role |

## Class roles

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/classes/:classId/roles` | List class roles |
| POST | `/classes/:classId/roles` | Create custom class role |
| PATCH | `/classes/:classId/roles/:roleId` | Update custom class role |
| DELETE | `/classes/:classId/roles/:roleId` | Delete custom class role |

## Sessions

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/classes/:classId/sessions` | Tạo session |
| GET | `/classes/:classId/sessions` | List sessions |
| GET | `/sessions/:sessionId` | Session detail |
| PATCH | `/sessions/:sessionId` | Update session |
| DELETE | `/sessions/:sessionId` | Delete/cancel session |

## Attendances

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/sessions/:sessionId/attendances` | Teacher xem attendance |
| GET | `/sessions/:sessionId/attendances/me` | Student xem attendance của mình |
| PATCH | `/sessions/:sessionId/attendances/:studentId` | Teacher update attendance |
| POST | `/sessions/:sessionId/attendances/me` | Student self check-in |

## Materials

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/workspaces/:workspaceId/materials/upload-init` | Init multipart upload |
| POST | `/workspaces/:workspaceId/materials/upload-sign-part` | Sign upload part |
| POST | `/workspaces/:workspaceId/materials/upload-complete` | Complete upload |
| POST | `/workspaces/:workspaceId/materials/upload-abort` | Abort upload |
| GET | `/workspaces/:workspaceId/materials` | List workspace materials |
| GET | `/materials/:materialId` | Material detail |
| GET | `/materials/:materialId/download` | Redirect signed download |
| DELETE | `/materials/:materialId` | Delete material |

## Lectures

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/sessions/:sessionId/lectures` | Tạo lecture |
| GET | `/sessions/:sessionId/lectures` | List lectures |
| GET | `/lectures/:lectureId` | Lecture detail |
| GET | `/lectures/:lectureId/materials/:materialId/download` | Download lecture material |
| PATCH | `/lectures/:lectureId` | Update lecture |
| DELETE | `/lectures/:lectureId` | Delete lecture |

## Assignments và quiz

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/sessions/:sessionId/assignments` | Tạo assignment |
| GET | `/sessions/:sessionId/assignments` | List assignments |
| GET | `/assignments/:assignmentId` | Assignment detail |
| GET | `/assignments/:assignmentId/quiz/manage` | Teacher quiz management view |
| GET | `/assignments/:assignmentId/quiz` | Student quiz view |
| POST | `/assignments/:assignmentId/quiz/questions` | Create quiz question |
| PATCH | `/assignments/:assignmentId/quiz/questions/:questionId` | Update quiz question |
| DELETE | `/assignments/:assignmentId/quiz/questions/:questionId` | Delete quiz question |
| POST | `/assignments/:assignmentId/quiz/questions/:questionId/options` | Create quiz option |
| PATCH | `/assignments/:assignmentId/quiz/options/:optionId` | Update quiz option |
| DELETE | `/assignments/:assignmentId/quiz/options/:optionId` | Delete quiz option |
| GET | `/assignments/:assignmentId/quiz/questions/:questionId/materials/:materialId/download` | Download quiz question material |
| POST | `/assignments/:assignmentId/quiz/attempts/me/start` | Student start attempt |
| GET | `/assignments/:assignmentId/quiz/attempts/me` | Student get own attempt |
| POST | `/assignments/:assignmentId/quiz/attempts/me/submit` | Student submit attempt |
| GET | `/assignments/:assignmentId/quiz/attempts` | Teacher list attempts |
| GET | `/assignments/:assignmentId/quiz/attempts/:studentId` | Teacher get student attempt |
| GET | `/assignments/:assignmentId/materials/:materialId/download` | Download assignment material |
| DELETE | `/assignments/:assignmentId` | Delete assignment |

## Submissions

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/assignments/:assignmentId/submissions/me/upload-init` | Init student submission upload |
| POST | `/assignments/:assignmentId/submissions/me/upload-sign-part` | Sign submission upload part |
| POST | `/assignments/:assignmentId/submissions/me/upload-complete` | Complete submission upload |
| POST | `/assignments/:assignmentId/submissions/me/upload-abort` | Abort submission upload |
| GET | `/assignments/:assignmentId/submissions/me/download` | Student download own submission |
| GET | `/assignments/:assignmentId/submissions/me` | Student get own submission |
| GET | `/assignments/:assignmentId/submissions` | Teacher list submissions |
| GET | `/assignments/:assignmentId/submissions/:studentId/download` | Teacher download student submission |
| GET | `/assignments/:assignmentId/submissions/:studentId` | Teacher get student submission |
| PATCH | `/assignments/:assignmentId/submissions/:studentId/review` | Teacher review/grade |

## Notifications

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/notifications/me` | List my notifications |
| GET | `/notifications/me/unread-count` | Unread count |
| PATCH | `/notifications/:notificationId/read` | Mark one read |
| PATCH | `/notifications/me/read-all` | Mark all read |

## Billing

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/billing/me/subscription` | Current billing subscription |
| POST | `/billing/me/subscription` | Start paid subscription |
| POST | `/billing/mock/transactions/:transactionId/pay` | Mock pay transaction |
| POST | `/billing/mock/transactions/:transactionId/fail` | Mock fail transaction |
| POST | `/billing/me/subscription/cancel` | Cancel at period end |
