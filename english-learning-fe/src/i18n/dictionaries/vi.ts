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
  landing: {
    nav: {
      features: "Tính năng",
      pricing: "Giá cả",
    },
    hero: {
      badge: "Được tin dùng bởi 10,000+ giáo viên thiết kế",
      title: "Nền tảng tối ưu cho giáo dục thiết kế",
      description:
        "Quản lý lớp Figma, theo dõi tiến độ học sinh và tối ưu hóa bài tập trong một nền tảng đẹp mắt. Được xây dựng dành riêng cho giáo viên thiết kế.",
      startFree: "Bắt đầu dạy miễn phí",
      watchDemo: "Xem demo",
      noCard: "Không cần thẻ tín dụng • Bắt đầu trong 2 phút",
    },
    features: {
      title: "Mọi thứ bạn cần để dạy thiết kế",
      description:
        "Các tính năng mạnh mẽ được thiết kế đặc biệt cho giáo viên thiết kế",
      items: {
        classManagement: {
          title: "Quản lý lớp học",
          description: "Tạo và tổ chức lớp học không giới hạn một cách dễ dàng",
        },
        studentTracking: {
          title: "Theo dõi học sinh",
          description: "Giám sát tiến độ và sự tham gia của học sinh",
        },
        assignments: {
          title: "Bài tập",
          description: "Tạo, phân phát và chấm bài tập",
        },
        calendar: {
          title: "Lịch & Sự kiện",
          description: "Lên lịch lớp học và quản lý ngày quan trọng",
        },
        analytics: {
          title: "Phân tích",
          description: "Theo dõi hiệu suất với thông tin chi tiết",
        },
        grading: {
          title: "Chấm điểm dễ dàng",
          description: "Hệ thống chấm điểm và phản hồi được tối ưu hóa",
        },
      },
    },
    testimonials: {
      title: "Được yêu thích bởi giáo viên thiết kế",
      description: "Xem giáo viên nói gì về chúng tôi",
      items: {
        michael: {
          name: "Michael Chen",
          role: "Giảng viên thiết kế",
          content:
            "Nền tảng này đã thay đổi cách tôi quản lý lớp Figma. Giao diện trực quan và học sinh của tôi rất thích!",
        },
        emily: {
          name: "Emily Rodriguez",
          role: "Giáo viên UX/UI",
          content:
            "Cuối cùng cũng có công cụ quản lý lớp học được thiết kế đặc biệt cho giáo dục thiết kế. Việc theo dõi bài tập thật tuyệt vời.",
        },
        david: {
          name: "David Kim",
          role: "Trưởng bootcamp thiết kế",
          content:
            "Chuyển từ nhiều công cụ sang chỉ một nền tảng này. Tiết kiệm hàng giờ mỗi tuần. Rất khuyến khích!",
        },
      },
    },
    pricing: {
      title: "Giá cả đơn giản, minh bạch",
      description: "Chọn gói phù hợp nhất với bạn",
      mostPopular: "Phổ biến nhất",
      plans: {
        free: {
          name: "Miễn phí",
          price: "$0",
          period: "mãi mãi",
          description: "Hoàn hảo để thử nghiệm",
          features: [
            "Tối đa 3 lớp học",
            "Số học sinh không giới hạn mỗi lớp",
            "Phân tích cơ bản",
            "Quản lý bài tập",
            "Lịch & sự kiện",
            "Hỗ trợ email",
          ],
          cta: "Bắt đầu miễn phí",
        },
        pro: {
          name: "Pro",
          price: "$29",
          period: "mỗi tháng",
          description: "Dành cho giáo viên chuyên nghiệp",
          features: [
            "Tối đa 10 lớp học",
            "Số học sinh không giới hạn",
            "Phân tích nâng cao",
            "Hỗ trợ ưu tiên",
            "Thương hiệu tùy chỉnh",
            "Xuất dữ liệu",
            "Công cụ tự động hóa",
          ],
          cta: "Bắt đầu dùng thử miễn phí",
        },
        enterprise: {
          name: "Enterprise",
          price: "$99",
          period: "mỗi tháng",
          description: "Dành cho trường học & tổ chức",
          features: [
            "Lớp học không giới hạn",
            "Số học sinh không giới hạn",
            "Phân tích nâng cao",
            "Hỗ trợ chuyên dụng",
            "Tích hợp tùy chỉnh",
            "API access",
            "Hợp tác nhóm",
            "Tùy chọn white-label",
          ],
          cta: "Liên hệ bán hàng",
        },
      },
    },
    cta: {
      title: "Sẵn sàng biến đổi lớp thiết kế của bạn?",
      description:
        "Tham gia cùng hàng nghìn giáo viên đang sử dụng Figma Class Manager",
      startTrial: "Bắt đầu dùng thử miễn phí",
    },
    footer: {
      brand: {
        description:
          "Nền tảng tối ưu cho giáo dục thiết kế và quản lý lớp học.",
      },
      sections: {
        product: {
          title: "Sản phẩm",
          features: "Tính năng",
          pricing: "Giá cả",
          updates: "Cập nhật",
          roadmap: "Lộ trình",
        },
        resources: {
          title: "Tài nguyên",
          documentation: "Tài liệu",
          tutorials: "Hướng dẫn",
          blog: "Blog",
          support: "Hỗ trợ",
        },
        company: {
          title: "Công ty",
          about: "Về chúng tôi",
          contact: "Liên hệ",
          privacy: "Bảo mật",
          terms: "Điều khoản",
        },
      },
      copyright: "© 2026 Figma Class Manager. Tất cả quyền được bảo lưu.",
    },
  },
  login: {
    brandBadge: "Học trực tuyến - Lộ trình rõ ràng",
    welcomeTitle: "Đăng nhập để tiếp tục hành trình học tiếng Nhật của bạn.",
    welcomeDescription:
      "Truy cập lớp học, bài tập và tiến độ học tập trong một không gian gọn gàng, dễ dùng và tập trung.",
    formBadge: "Chào mừng quay lại",
    formTitle: "Đăng nhập",
    formDescription:
      "Nhập username và mật khẩu để tiếp tục học, theo dõi tiến độ và quản lý tài khoản của bạn.",
    userNameLabel: "Tên đăng nhập",
    userNamePlaceholder: "Nhập tên đăng nhập của bạn",
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
      accountDisabled: "Tài khoản đã bị khoá.",
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
    overview: {
      title: "Tổng quan giảng dạy",
      description: "Nắm rõ thông tin cá nhân và hiệu suất lớp học của bạn.",
      profileTitle: "Hồ sơ giáo viên",
      profileFullName: "Họ và tên",
      profileUserName: "Tên đăng nhập",
      profileEmail: "Email",
      statsTitle: "Thông số nhanh",
      statsClasses: "Lớp đang có",
      statsStudents: "Học viên",
      statsAssignments: "Bài tập",
      statsTests: "Bài kiểm tra",
      loading: "Đang tải...",
      loadError: "Không tải được thông tin. Vui lòng đăng nhập lại.",
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
      "Điền tên, tên đăng nhập, email và mật khẩu để tạo tài khoản mới và bắt đầu học ngay.",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên của bạn",
    userNameLabel: "Tên đăng nhập",
    userNamePlaceholder: "Nhập tên đăng nhập",
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
    errors: {
      credentialsAlreadyExist: "Email hoặc tên đăng nhập đã tồn tại.",
      fullNameRequired: "Họ và tên không được để trống.",
      userNameRequired: "Tên đăng nhập không được để trống.",
      passwordTooShort: "Mật khẩu phải có ít nhất 6 ký tự.",
      passwordRequired: "Mật khẩu không được để trống.",
      emailInvalid: "Email không hợp lệ.",
    },
  },
  dashboard: {
    title: "Bảng điều khiển",
    description: "Tổng hợp nhanh hiệu suất lớp học của bạn",
    activeClasses: "Lớp học đang hoạt động",
    totalStudents: "Tổng số học viên",
    avgProgress: "Tiến độ trung bình",
    pendingWork: "Bài tập chờ",
    activeClassesList: "Lớp học gần đây",
    topStudents: "Học sinh hàng đầu",
    upcomingProjects: "Dự án sắp tới",
    viewAllClasses: "Xem tất cả lớp",
    viewAllStudents: "Xem tất cả học viên",
    status: "Trạng thái",
    due: "Hạn chót",
    submitted: "Đã nộp",
    createClass: "Tạo lớp mới",
    planLabel: "Gói hiện tại",
    greeting: "Chào mừng! Dưới đây là tổng quan lớp học của bạn.",
    createDialogTitle: "Tạo lớp mới",
    createDialogDescription: "Thêm một lớp học mới vào chương trình giảng dạy",
    createDialogCancel: "Hủy",
    createDialogSubmit: "Tạo lớp",
    upgradeAlert:
      "Bạn đã đạt giới hạn gói {maxClasses} lớp. Nâng cấp để tạo tiếp.",
    upgradePlan: "Nâng cấp lên Pro",
    planPrice: "$29/ tháng",
    planBenefits:
      "Lên đến 10 lớp, học viên không giới hạn, phân tích sâu, hỗ trợ ưu tiên",
  },
  notFound: {
    title: "Không tìm thấy trang",
    description:
      "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.",
    goHome: "Về trang chủ",
    backToDashboard: "Quay lại bảng điều khiển",
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
