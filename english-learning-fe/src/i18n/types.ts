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
    emailLabel: string;
    emailPlaceholder: string;
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
  options: {
    locales: Record<Locale, string>;
    themes: Record<Theme, string>;
  };
};
