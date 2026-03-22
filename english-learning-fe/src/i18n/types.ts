import type { Locale, Theme } from "@/config/app-settings";

export type Dictionary = {
  appName: string;
  home: {
    heading: string;
    description: string;
    paletteHeading: string;
    paletteDescription: string;
    localeLabel: string;
    themeLabel: string;
  };
  login: {
    brandBadge: string;
    welcomeTitle: string;
    formTitle: string;
    userNameLabel: string;
    userNamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    submit: string;
    or: string;
    loginWithGoogle: string;
    loginWithFacebook: string;
    noAccount: string;
    signUpNow: string;
    welcomeDescription: string;
    formDescription: string;
    formBadge: string;
    submitLoading: string;
    defaultSuccessMessage: string;
    defaultErrorMessage: string;
    errors: {
      usernameNotRegistered: string;
      passwordIncorrect: string;
      usernameInvalid: string;
      passwordInvalid: string;
      accountDisabled: string;
    };
  };
  signUp: {
    brandBadge: string;
    welcomeTitle: string;
    welcomeDescription: string;
    formTitle: string;
    formDescription: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    userNameLabel: string;
    userNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    alreadyAccount: string;
    signInNow: string;
    submit: string;
    submitLoading: string;
    defaultSuccessMessage: string;
    defaultErrorMessage: string;
    passwordMismatch: string;
    errors: {
      credentialsAlreadyExist: string;
      fullNameRequired: string;
      userNameRequired: string;
      passwordTooShort: string;
      passwordRequired: string;
      emailInvalid: string;
    };
  };
  myCourse: {
    topbar: {
      collapseAllCourses: string;
      openMenu: string;
      closeMenu: string;
      profileMenu: string;
    };
    breadcrumb: {
      home: string;
      current: string;
    };
    sidebar: {
      brandName: string;
      userName: string;
      sections: {
        learningCorner: string;
        mockExam: string;
        payment: string;
      };
      items: {
        stats: string;
        myClasses: string;
        myCourses: string;
        favoriteVideos: string;
        flashcards: string;
        myNotes: string;
        practiceTests: string;
        jlptMock: string;
        levelAssessment: string;
        testHistory: string;
        myPackage: string;
      };
      badges: {
        newLabel: string;
      };
    };
    overview: {
      title: string;
      description: string;
      profileTitle: string;
      profileFullName: string;
      profileUserName: string;
      profileEmail: string;
      statsTitle: string;
      statsClasses: string;
      statsStudents: string;
      statsAssignments: string;
      statsTests: string;
      loading: string;
      loadError: string;
    };
    emptyBanner: {
      title: string;
      description: string;
      storeButton: string;
      consultButton: string;
    };
    suggested: {
      title: string;
      tagMain: string;
      consultButton: string;
      durationThreeMonths: string;
      teachers: {
        tuyenAndOthers: string;
        updating: string;
        tuyen: string;
        leAndOthers: string;
      };
      courses: {
        n5: string;
        n5Hvc: string;
        beginnerJapanese: string;
        kaiwa: string;
      };
    };
  };
  dashboard: {
    title: string;
    description: string;
    activeClasses: string;
    totalStudents: string;
    avgProgress: string;
    pendingWork: string;
    activeClassesList: string;
    topStudents: string;
    upcomingProjects: string;
    viewAllClasses: string;
    viewAllStudents: string;
    status: string;
    due: string;
    submitted: string;
    createClass: string;
    planLabel: string;
    greeting: string;
    createDialogTitle: string;
    createDialogDescription: string;
    createDialogCancel: string;
    createDialogSubmit: string;
    upgradeAlert: string;
    upgradePlan: string;
    planPrice: string;
    planBenefits: string;
  };
  notFound: {
    title: string;
    description: string;
    goHome: string;
    backToDashboard: string;
  };
  options: {
    locales: Record<Locale, string>;
    themes: Record<Theme, string>;
  };
};
