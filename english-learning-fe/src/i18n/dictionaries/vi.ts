import type { Dictionary } from "@/i18n/types";

export const VI_DICTIONARY: Dictionary = {
  appName: "English Learning",
  home: {
    heading: "Nền tảng frontend sẵn sàng cho theme và đa ngôn ngữ",
    description:
      "Cấu trúc này giúp quản lý tập trung token giao diện và nội dung đa ngôn ngữ.",
    paletteHeading: "Bảng màu Primary",
    paletteDescription:
      "Dùng class như bg-primary, text-primary, bg-primary-700, hoặc border-primary-300.",
    localeLabel: "Ngôn ngữ",
    themeLabel: "Giao diện",
  },
  login: {
    brandBadge: "Học trực tuyến - Lộ trình rõ ràng",
    welcomeTitle: "Đăng nhập để tiếp tục hành trình học tiếng Nhật của bạn.",
    welcomeDescription:
      "Truy cập lớp học, bài tập và tiến độ học tập trong một không gian gọn gàng, dễ dùng và tập trung.",
    formBadge: "Chào mừng quay lại",
    formTitle: "Đăng nhập",
    formDescription:
      "Nhập email và mật khẩu để tiếp tục học, theo dõi tiến độ và quản lý tài khoản của bạn.",
    emailLabel: "Email",
    emailPlaceholder: "Nhập email của bạn",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    rememberMe: "Ghi nhớ đăng nhập",
    forgotPassword: "Quên mật khẩu?",
    submit: "Đăng nhập",
    submitLoading: "Đang tải...",
    or: "hoặc",
    loginWithGoogle: "Google",
    loginWithFacebook: "Facebook",
    noAccount: "Chưa có tài khoản?",
    signUpNow: "Đăng ký ngay",
    defaultSuccessMessage: "Đăng nhập thành công",
    defaultErrorMessage: "Có lỗi xảy ra. Vui lòng thử lại.",
    errors: {
      usernameNotRegistered: "Tài khoản chưa được đăng ký.",
      passwordIncorrect: "Mật khẩu không đúng.",
      usernameInvalid: "Tên đăng nhập không hợp lệ.",
      passwordInvalid: "Mật khẩu không hợp lệ.",
    },
  },
  myCourse: {
    topbar: {
      collapseAllCourses: "Thu gọn toàn bộ khóa học",
      openMenu: "Mở menu",
      closeMenu: "Đóng menu",
      profileMenu: "Mở menu tài khoản",
    },
    breadcrumb: {
      home: "Trang chủ",
      current: "Khóa học của tôi",
    },
    sidebar: {
      brandName: "Riki Nihongo",
      userName: "Mạnh Châu",
      sections: {
        learningCorner: "Góc học tập",
        mockExam: "Thi thử",
        payment: "Thanh toán",
      },
      items: {
        stats: "Thống kê",
        myClasses: "Lớp học của tôi",
        myCourses: "Khóa học của tôi",
        favoriteVideos: "Bài học video yêu thích",
        flashcards: "Flashcard",
        myNotes: "Ghi chú của tôi",
        practiceTests: "Luyện đề",
        jlptMock: "Thi thử JLPT",
        levelAssessment: "Kiểm tra năng lực",
        testHistory: "Lịch sử làm bài",
        myPackage: "Gói của tôi",
      },
      badges: {
        newLabel: "Mới",
      },
    },
    emptyBanner: {
      title: "Hiện tại bạn chưa có khóa học nào",
      description: "Hãy liên hệ với Riki để nhận tư vấn 24/7",
      storeButton: "Tới cửa hàng",
      consultButton: "Nhận tư vấn",
    },
    suggested: {
      title: "Khóa học gợi ý",
      tagMain: "Khóa chính",
      consultButton: "Nhận tư vấn",
      durationThreeMonths: "3 tháng",
      teachers: {
        tuyenAndOthers: "Nguyễn Minh Tuyến, Nguyễn...",
        updating: "Đang cập nhật",
        tuyen: "Nguyễn Minh Tuyến",
        leAndOthers: "Hứa Thị Lệ, Nguyễn Thu Phú...",
      },
      courses: {
        n5: "Khóa học N5",
        n5Hvc: "Khóa học N5-HVC",
        beginnerJapanese: "Tiếng Nhật dành cho người mới bắt đầu",
        kaiwa: "Luyện Kaiwa từ cơ bản đến nâng cao",
      },
    },
  },
  signUp: {
    brandBadge: "Học trực tuyến - Bước khởi đầu",
    welcomeTitle: "Đăng ký để bắt đầu hành trình học tiếng Nhật của bạn.",
    welcomeDescription:
      "Tạo tài khoản để truy cập khoá học, tiến độ và quản lý hồ sơ cá nhân dễ dàng.",
    formTitle: "Đăng ký",
    formDescription:
      "Điền tên, email và mật khẩu để tạo tài khoản mới và bắt đầu học ngay.",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên của bạn",
    emailLabel: "Email",
    emailPlaceholder: "Nhập email của bạn",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    confirmPasswordLabel: "Xác nhận mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu",
    alreadyAccount: "Đã có tài khoản?",
    signInNow: "Đăng nhập ngay",
    submit: "Đăng ký",
    submitLoading: "Đang xử lý...",
    defaultSuccessMessage: "Đăng ký thành công!",
    defaultErrorMessage: "Có lỗi xảy ra. Vui lòng thử lại.",
    passwordMismatch: "Mật khẩu và xác nhận mật khẩu không khớp.",
  },
  options: {
    locales: {
      vi: "Tiếng Việt",
      en: "English",
    },
    themes: {
      light: "Sáng",
      dark: "Tối",
    },
  },
};
