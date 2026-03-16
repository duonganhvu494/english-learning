import type { Dictionary } from "@/i18n/types";

export const EN_DICTIONARY: Dictionary = {
  appName: "English Learning",
  home: {
    heading: "Frontend foundation ready for theme and locale switching",
    description:
      "This setup keeps design tokens and dictionary content centralized for easier scaling.",
    paletteHeading: "Primary color palette",
    paletteDescription:
      "Use classes like bg-primary, text-primary, bg-primary-700, or border-primary-300.",
    localeLabel: "Language",
    themeLabel: "Theme",
  },
  login: {
    brandBadge: "Online learning - Clear roadmap",
    welcomeTitle: "Sign in to continue your Japanese learning journey.",
    welcomeDescription:
      "Access your classes, assignments, and learning progress in a clean, focused workspace.",
    formBadge: "Welcome back",
    formTitle: "Sign in",
    formDescription:
      "Enter your email and password to continue learning, track progress, and manage your account.",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    submit: "Sign in",
    submitLoading: "Loading...",
    or: "or",
    loginWithGoogle: "Google",
    loginWithFacebook: "Facebook",
    noAccount: "Don't have an account?",
    signUpNow: "Sign up now",
    defaultSuccessMessage: "Login successful",
    defaultErrorMessage: "Something went wrong. Please try again.",
    errors: {
      usernameNotRegistered: "Username is not registered.",
      passwordIncorrect: "Password is incorrect.",
      usernameInvalid: "Username is not valid.",
      passwordInvalid: "Password is not valid.",
    },
  },
  myCourse: {
    topbar: {
      collapseAllCourses: "Collapse all courses",
      openMenu: "Open sidebar",
      closeMenu: "Close sidebar",
      profileMenu: "Open profile menu",
    },
    breadcrumb: {
      home: "Home",
      current: "My courses",
    },
    sidebar: {
      brandName: "Riki Nihongo",
      userName: "Manh Chau",
      sections: {
        learningCorner: "Learning corner",
        mockExam: "Mock tests",
        payment: "Payment",
      },
      items: {
        stats: "Statistics",
        myClasses: "My classes",
        myCourses: "My courses",
        favoriteVideos: "Favorite video lessons",
        flashcards: "Flashcards",
        myNotes: "My notes",
        practiceTests: "Practice tests",
        jlptMock: "JLPT mock test",
        levelAssessment: "Level assessment",
        testHistory: "Test history",
        myPackage: "My package",
      },
      badges: {
        newLabel: "New",
      },
    },
    emptyBanner: {
      title: "You do not have any course yet",
      description: "Contact Riki to get 24/7 consultation support",
      storeButton: "Go to store",
      consultButton: "Get consultation",
    },
    suggested: {
      title: "Suggested courses",
      tagMain: "Main course",
      consultButton: "Get consultation",
      durationThreeMonths: "3 months",
      teachers: {
        tuyenAndOthers: "Nguyen Minh Tuyen, Nguyen...",
        updating: "Updating",
        tuyen: "Nguyen Minh Tuyen",
        leAndOthers: "Hua Thi Le, Nguyen Thu Phu...",
      },
      courses: {
        n5: "N5 course",
        n5Hvc: "N5-HVC course",
        beginnerJapanese: "Japanese for absolute beginners",
        kaiwa: "Kaiwa practice from basic to advanced",
      },
    },
  },
  options: {
    locales: {
      vi: "Vietnamese",
      en: "English",
    },
    themes: {
      light: "Light",
      dark: "Dark",
    },
  },
};
