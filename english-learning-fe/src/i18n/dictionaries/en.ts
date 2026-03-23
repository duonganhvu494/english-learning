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
  landing: {
    nav: {
      features: "Features",
      pricing: "Pricing",
    },
    hero: {
      badge: "Trusted by 10,000+ design educators",
      title: "The Ultimate Platform for Design Education",
      description:
        "Manage your Figma classes, track student progress, and streamline assignments all in one beautiful platform. Built for design educators.",
      startFree: "Start Teaching Free",
      watchDemo: "Watch Demo",
      noCard: "No credit card required • Get started in 2 minutes",
    },
    features: {
      title: "Everything You Need to Teach Design",
      description:
        "Powerful features designed specifically for design educators",
      items: {
        classManagement: {
          title: "Class Management",
          description: "Create and organize unlimited classes with ease",
        },
        studentTracking: {
          title: "Student Tracking",
          description: "Monitor student progress and engagement",
        },
        assignments: {
          title: "Assignments",
          description: "Create, distribute, and grade assignments",
        },
        calendar: {
          title: "Calendar & Events",
          description: "Schedule classes and manage important dates",
        },
        analytics: {
          title: "Analytics",
          description: "Track performance with detailed insights",
        },
        grading: {
          title: "Easy Grading",
          description: "Streamlined grading and feedback system",
        },
      },
    },
    testimonials: {
      title: "Loved by Design Educators",
      description: "See what teachers are saying about us",
      items: {
        michael: {
          name: "Michael Chen",
          role: "Design Instructor",
          content:
            "This platform has transformed how I manage my Figma classes. The interface is intuitive and my students love it!",
        },
        emily: {
          name: "Emily Rodriguez",
          role: "UX/UI Teacher",
          content:
            "Finally, a class management tool built specifically for design education. The assignment tracking is phenomenal.",
        },
        david: {
          name: "David Kim",
          role: "Design Bootcamp Lead",
          content:
            "Switched from multiple tools to just this platform. Saves me hours every week. Highly recommended!",
        },
      },
    },
    pricing: {
      title: "Simple, Transparent Pricing",
      description: "Choose the plan that works best for you",
      mostPopular: "Most Popular",
      plans: {
        free: {
          name: "Free",
          price: "$0",
          period: "forever",
          description: "Perfect for trying out",
          features: [
            "Up to 3 classes",
            "Unlimited students per class",
            "Basic analytics",
            "Assignment management",
            "Calendar & events",
            "Email support",
          ],
          cta: "Get Started Free",
        },
        pro: {
          name: "Pro",
          price: "$29",
          period: "per month",
          description: "For professional educators",
          features: [
            "Up to 10 classes",
            "Unlimited students",
            "Advanced analytics",
            "Priority support",
            "Custom branding",
            "Export data",
            "Automation tools",
          ],
          cta: "Start Free Trial",
        },
        enterprise: {
          name: "Enterprise",
          price: "$99",
          period: "per month",
          description: "For schools & institutions",
          features: [
            "Unlimited classes",
            "Unlimited students",
            "Advanced analytics",
            "Dedicated support",
            "Custom integrations",
            "API access",
            "Team collaboration",
            "White-label option",
          ],
          cta: "Contact Sales",
        },
      },
    },
    cta: {
      title: "Ready to Transform Your Design Classes?",
      description:
        "Join thousands of educators who are already using Figma Class Manager",
      startTrial: "Start Free Trial",
    },
    footer: {
      brand: {
        description:
          "The ultimate platform for design education and class management.",
      },
      sections: {
        product: {
          title: "Product",
          features: "Features",
          pricing: "Pricing",
          updates: "Updates",
          roadmap: "Roadmap",
        },
        resources: {
          title: "Resources",
          documentation: "Documentation",
          tutorials: "Tutorials",
          blog: "Blog",
          support: "Support",
        },
        company: {
          title: "Company",
          about: "About",
          contact: "Contact",
          privacy: "Privacy",
          terms: "Terms",
        },
      },
      copyright: "© 2026 Figma Class Manager. All rights reserved.",
    },
  },
  login: {
    brandBadge: "Online learning - Clear roadmap",
    welcomeTitle: "Sign in to continue your Japanese learning journey.",
    welcomeDescription:
      "Access your classes, assignments, and learning progress in a clean, focused workspace.",
    formBadge: "Welcome back",
    formTitle: "Sign in",
    formDescription:
      "Enter your username and password to continue learning, track progress, and manage your account.",
    userNameLabel: "Username",
    userNamePlaceholder: "Enter your username",
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
      accountDisabled: "Account is disabled.",
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
    overview: {
      title: "Teaching Overview",
      description:
        "Quickly see your profile and classroom performance at a glance.",
      profileTitle: "Teacher profile",
      profileFullName: "Full name",
      profileUserName: "Username",
      profileEmail: "Email",
      statsTitle: "Quick stats",
      statsClasses: "Active classes",
      statsStudents: "Students",
      statsAssignments: "Assignments",
      statsTests: "Tests",
      loading: "Loading...",
      loadError: "Unable to load profile. Please log in again.",
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
  signUp: {
    brandBadge: "Online learning - Your first step",
    welcomeTitle: "Sign up to start your Japanese learning journey.",
    welcomeDescription:
      "Create an account to access courses, track progress, and manage your profile.",
    formTitle: "Sign up",
    formDescription:
      "Enter your name, username, email, and password to create a new account and start learning.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Enter your full name",
    userNameLabel: "Username",
    userNamePlaceholder: "Enter your username",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Re-enter your password",
    alreadyAccount: "Already have an account?",
    signInNow: "Sign in now",
    submit: "Sign up",
    submitLoading: "Processing...",
    defaultSuccessMessage: "Sign-up successful!",
    defaultErrorMessage: "Something went wrong. Please try again.",
    passwordMismatch: "Password and confirm password do not match.",
    errors: {
      credentialsAlreadyExist: "Email or username already exists.",
      fullNameRequired: "Full name cannot be empty.",
      userNameRequired: "Username cannot be empty.",
      passwordTooShort: "Password must be at least 6 characters.",
      passwordRequired: "Password cannot be empty.",
      emailInvalid: "Email is invalid.",
    },
  },
  dashboard: {
    title: "Dashboard",
    description: "Quick snapshot of your classroom performance",
    activeClasses: "Active classes",
    totalStudents: "Total students",
    avgProgress: "Average progress",
    pendingWork: "Pending work",
    activeClassesList: "Recent classes",
    topStudents: "Top students",
    upcomingProjects: "Upcoming projects",
    viewAllClasses: "View all classes",
    viewAllStudents: "View all students",
    status: "Status",
    due: "Due",
    submitted: "Submitted",
    createClass: "Create class",
    planLabel: "Current plan",
    greeting: "Welcome back! Here's a summary of your classroom performance.",
    createDialogTitle: "Create new class",
    createDialogDescription: "Add a new class to your curriculum",
    createDialogCancel: "Cancel",
    createDialogSubmit: "Create class",
    upgradeAlert:
      "You reached the limit of {maxClasses} classes. Upgrade to add more.",
    upgradePlan: "Upgrade to Pro",
    planPrice: "$29/month",
    planBenefits:
      "Up to 10 classes, unlimited students, advanced analytics, priority support",
  },
  notFound: {
    title: "Page Not Found",
    description:
      "Sorry, the page you are looking for does not exist or has been moved.",
    goHome: "Go to Home",
    backToDashboard: "Back to Dashboard",
  },
  options: {
    locales: {
      vi: "Tiếng Việt",
      en: "English",
    },
    themes: {
      light: "Light",
      dark: "Dark",
    },
  },
};
