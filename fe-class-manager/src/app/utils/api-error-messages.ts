const API_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Dữ liệu nhập vào không hợp lệ",

  ASSIGNMENT_ACTOR_NOT_FOUND: "Không tìm thấy người thực hiện",
  ASSIGNMENT_DELETE_BLOCKED_HAS_ATTEMPTS:
    "Không thể xóa bài tập đã có lượt làm",
  ASSIGNMENT_DELETE_BLOCKED_HAS_SUBMISSIONS:
    "Không thể xóa bài tập đã có bài nộp",
  ASSIGNMENT_MATERIAL_NOT_ATTACHED: "Tài liệu chưa được gắn với bài tập",
  ASSIGNMENT_MATERIAL_NOT_READY: "Tài liệu bài tập chưa sẵn sàng",
  ASSIGNMENT_MATERIALS_NOT_FOUND: "Không tìm thấy tài liệu của bài tập",
  ASSIGNMENT_MATERIALS_NOT_READY: "Tài liệu bài tập chưa sẵn sàng",
  ASSIGNMENT_NOT_FOUND: "Không tìm thấy bài tập",
  ASSIGNMENT_QUIZ_ALREADY_STARTED: "Bài kiểm tra đã bắt đầu",
  ASSIGNMENT_QUIZ_ANSWERS_COUNT_INVALID: "Số lượng đáp án không hợp lệ",
  ASSIGNMENT_QUIZ_ATTEMPT_ALREADY_SUBMITTED: "Lượt làm bài đã được nộp",
  ASSIGNMENT_QUIZ_ATTEMPT_NOT_FOUND: "Không tìm thấy lượt làm bài",
  ASSIGNMENT_QUIZ_CLASS_MEMBERSHIP_REQUIRED:
    "Bạn phải là thành viên của lớp để làm bài",
  ASSIGNMENT_QUIZ_CLOSED: "Bài kiểm tra đã đóng",
  ASSIGNMENT_QUIZ_NOT_OPEN_YET: "Bài kiểm tra chưa mở",
  ASSIGNMENT_QUIZ_NOT_READY: "Bài kiểm tra chưa sẵn sàng",
  ASSIGNMENT_QUIZ_OPTION_CONTENT_REQUIRED:
    "Nội dung đáp án không được để trống",
  ASSIGNMENT_QUIZ_OPTION_MISMATCH: "Đáp án không thuộc câu hỏi này",
  ASSIGNMENT_QUIZ_OPTION_NOT_FOUND: "Không tìm thấy đáp án",
  ASSIGNMENT_QUIZ_QUESTION_CONTENT_REQUIRED:
    "Nội dung câu hỏi không được để trống",
  ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_ATTACHED:
    "Tài liệu chưa được gắn với câu hỏi",
  ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_FOUND:
    "Không tìm thấy tài liệu câu hỏi",
  ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_READY: "Tài liệu câu hỏi chưa sẵn sàng",
  ASSIGNMENT_QUIZ_QUESTION_MISMATCH: "Câu hỏi không thuộc bài kiểm tra này",
  ASSIGNMENT_QUIZ_QUESTION_NOT_FOUND: "Không tìm thấy câu hỏi",
  ASSIGNMENT_QUIZ_QUESTION_POINTS_INVALID: "Điểm câu hỏi không hợp lệ",
  ASSIGNMENT_QUIZ_QUESTION_TYPE_UNSUPPORTED: "Dạng câu hỏi không được hỗ trợ",
  ASSIGNMENT_QUIZ_STUDENT_ROLE_REQUIRED: "Chỉ học viên mới được làm bài",
  ASSIGNMENT_QUIZ_TYPE_REQUIRED: "Vui lòng chọn dạng bài kiểm tra",
  ASSIGNMENT_SESSION_NOT_FOUND: "Không tìm thấy buổi học của bài tập",
  ASSIGNMENT_TIME_END_INVALID: "Thời gian kết thúc bài tập không hợp lệ",
  ASSIGNMENT_TIME_START_IN_PAST: "Thời gian bắt đầu không được ở quá khứ",
  ASSIGNMENT_TIME_START_INVALID: "Thời gian bắt đầu bài tập không hợp lệ",
  ASSIGNMENT_TIME_WINDOW_INVALID: "Khoảng thời gian bài tập không hợp lệ",
  ASSIGNMENT_TITLE_ALREADY_EXISTS_IN_SESSION:
    "Tên bài tập đã tồn tại trong buổi học",
  ASSIGNMENT_TITLE_REQUIRED: "Tên bài tập không được để trống",

  ATTENDANCE_CHECKIN_CLOSED: "Điểm danh đã đóng",
  ATTENDANCE_LATE_CHECKIN_WINDOW_CLOSED: "Thời gian điểm danh muộn đã đóng",
  ATTENDANCE_SELF_CHECKIN_ABSENT_LOCKED: "Bạn đã bị khóa điểm danh vắng mặt",
  ATTENDANCE_SELF_CHECKIN_CLASS_STUDENT_REQUIRED:
    "Bạn phải là học viên của lớp",
  ATTENDANCE_SELF_CHECKIN_LATE_MINUTES: "Số phút đi muộn không hợp lệ",
  ATTENDANCE_SELF_CHECKIN_STUDENT_ACCOUNT_REQUIRED:
    "Không tìm thấy tài khoản học viên",
  ATTENDANCE_SESSION_NOT_FOUND: "Không tìm thấy buổi học điểm danh",
  ATTENDANCE_STUDENT_NOT_ASSIGNED_TO_SESSION_CLASS:
    "Học viên chưa được phân vào lớp của buổi học",
  ATTENDANCE_VIEW_CLASS_STUDENT_REQUIRED: "Bạn phải là học viên của lớp",
  ATTENDANCE_VIEW_STUDENT_ACCOUNT_REQUIRED: "Không tìm thấy tài khoản học viên",

  AUTH_ACCESS_TOKEN_REVOKED: "Phiên đăng nhập đã bị thu hồi",
  AUTH_ACCOUNT_DISABLED: "Tài khoản đã bị vô hiệu hóa",
  AUTH_CURRENT_PASSWORD_INCORRECT: "Mật khẩu hiện tại không chính xác",
  AUTH_EMAIL_CHANGE_INVALID: "Yêu cầu đổi email không hợp lệ",
  AUTH_EMAIL_NOT_VERIFIED: "Email chưa được xác minh",
  AUTH_EMAIL_VERIFICATION_OTP_EXPIRED: "Mã xác minh email đã hết hạn",
  AUTH_EMAIL_VERIFICATION_OTP_INVALID: "Mã xác minh email không hợp lệ",
  AUTH_LOGIN_RATE_LIMITED:
    "Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau",
  AUTH_NEW_PASSWORD_MUST_DIFFERENT: "Mật khẩu mới phải khác mật khẩu hiện tại",
  AUTH_PASSWORD_CHANGE_REQUIRED: "Vui lòng đổi mật khẩu trước khi tiếp tục",
  AUTH_PASSWORD_INCORRECT: "Mật khẩu không chính xác",
  AUTH_PASSWORD_RESET_OTP_EXPIRED: "Mã đặt lại mật khẩu đã hết hạn",
  AUTH_PASSWORD_RESET_OTP_INVALID: "Mã đặt lại mật khẩu không hợp lệ",
  AUTH_REFRESH_SESSION_INVALID: "Phiên làm mới không hợp lệ",
  AUTH_REFRESH_SESSION_REVOKED: "Phiên làm mới đã bị thu hồi",
  AUTH_REGISTRATION_INVALID: "Thông tin đăng ký không hợp lệ",
  AUTH_SUPER_ADMIN_REQUIRED: "Bạn cần quyền quản trị viên cấp cao",
  AUTH_UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
  AUTH_USERNAME_NOT_REGISTERED: "Tên đăng nhập chưa được đăng ký",

  BILLING_ALREADY_SUBSCRIBED_TO_PLAN: "Bạn đã đăng ký gói này",
  BILLING_CANCELLATION_ALREADY_SCHEDULED: "Gói đã được lên lịch hủy",
  BILLING_PLAN_CHANGE_ALREADY_SCHEDULED: "Đã có lịch thay đổi gói",
  BILLING_PLAN_NOT_BILLABLE: "Gói này không thể thanh toán",
  BILLING_PLAN_NOT_FOUND: "Không tìm thấy gói dịch vụ",
  BILLING_STRIPE_INVOICE_PERIOD_MISSING: "Hóa đơn Stripe thiếu kỳ thanh toán",
  BILLING_STRIPE_INVOICE_PRICE_MISSING: "Hóa đơn Stripe thiếu giá",
  BILLING_STRIPE_PRICE_NOT_CONFIGURED: "Giá Stripe chưa được cấu hình",
  BILLING_STRIPE_SUBSCRIPTION_MISMATCH: "Gói đăng ký Stripe không khớp",
  BILLING_STRIPE_SUBSCRIPTION_REF_MISSING: "Thiếu mã tham chiếu gói Stripe",
  BILLING_STRIPE_TRANSACTION_MISMATCH: "Giao dịch Stripe không khớp",
  BILLING_STRIPE_WORKSPACE_MISMATCH: "Workspace Stripe không khớp",
  BILLING_SUBSCRIPTION_ALREADY_EXISTS: "Gói đăng ký đã tồn tại",
  BILLING_SUBSCRIPTION_NOT_FOUND: "Không tìm thấy gói đăng ký",
  BILLING_SUBSCRIPTION_STATUS_INVALID: "Trạng thái gói đăng ký không hợp lệ",
  BILLING_TRANSACTION_NOT_FOUND: "Không tìm thấy giao dịch thanh toán",
  BILLING_TRANSACTION_STATUS_INVALID: "Trạng thái giao dịch không hợp lệ",

  CLASS_NAME_ALREADY_EXISTS: "Tên lớp đã tồn tại",
  CLASS_NOT_FOUND: "Không tìm thấy lớp học",
  CLASS_ROLE_NOT_FOUND: "Không tìm thấy vai trò của lớp",
  CLASS_STUDENT_NOT_ASSIGNED: "Học viên chưa được phân vào lớp",
  CLASS_STUDENTS_OUTSIDE_WORKSPACE: "Học viên không thuộc workspace",
  SESSION_CLASS_NOT_FOUND: "Không tìm thấy lớp học",

  SESSION_NOT_FOUND: "Không tìm thấy buổi học",

  SESSION_TOPIC_REQUIRED: "Chủ đề buổi học không được để trống",

  SESSION_TIME_INVALID: "Thời gian buổi học không hợp lệ",

  SESSION_TIME_START_IN_PAST: "Thời gian bắt đầu không được ở quá khứ",

  SESSION_TIME_END_BEFORE_START:
    "Thời gian kết thúc phải sau thời gian bắt đầu",

  SESSION_DUPLICATE_IN_CLASS:
    "Buổi học có cùng chủ đề và thời gian đã tồn tại trong lớp",

  AUTH_CSRF_INVALID: "Phiên làm việc đã hết hạn. Vui lòng thử lại",

  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",

  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
};

export function getApiErrorTranslation(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }

  return API_ERROR_MESSAGES[code];
}
