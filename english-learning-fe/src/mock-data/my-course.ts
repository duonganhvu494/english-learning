export type SidebarSectionKey = "learningCorner" | "mockExam" | "payment" | null;

export type SidebarItemKey =
  | "stats"
  | "myClasses"
  | "myCourses"
  | "favoriteVideos"
  | "flashcards"
  | "myNotes"
  | "practiceTests"
  | "jlptMock"
  | "levelAssessment"
  | "testHistory"
  | "myPackage";

export const sidebarSections: Array<{
  titleKey: SidebarSectionKey;
  items: Array<{
    key: SidebarItemKey;
    icon: string;
    active: boolean;
    badgeKey?: "newLabel";
  }>;
}> = [
  {
    titleKey: null,
    items: [
      { key: "stats", icon: "chart", active: false },
      { key: "myClasses", icon: "book", active: false },
    ],
  },
  {
    titleKey: "learningCorner",
    items: [
      { key: "myCourses", icon: "graduation", active: true },
      { key: "favoriteVideos", icon: "heart", active: false },
      { key: "flashcards", icon: "cards", active: false },
      { key: "myNotes", icon: "note", active: false },
      { key: "practiceTests", icon: "file", active: false, badgeKey: "newLabel" },
    ],
  },
  {
    titleKey: "mockExam",
    items: [
      { key: "jlptMock", icon: "exam", active: false },
      { key: "levelAssessment", icon: "check", active: false },
      { key: "testHistory", icon: "history", active: false },
    ],
  },
  {
    titleKey: "payment",
    items: [{ key: "myPackage", icon: "wallet", active: false }],
  },
];

export type SuggestedCourseKey = "n5" | "n5Hvc" | "beginnerJapanese" | "kaiwa";
export type TeacherKey = "tuyenAndOthers" | "updating" | "tuyen" | "leAndOthers";

export const suggestedCourses: Array<{
  id: number;
  titleKey: SuggestedCourseKey;
  teacherKey: TeacherKey;
}> = [
  {
    id: 1,
    titleKey: "n5",
    teacherKey: "tuyenAndOthers",
  },
  {
    id: 2,
    titleKey: "n5Hvc",
    teacherKey: "updating",
  },
  {
    id: 3,
    titleKey: "beginnerJapanese",
    teacherKey: "tuyen",
  },
  {
    id: 4,
    titleKey: "kaiwa",
    teacherKey: "leAndOthers",
  },
];
