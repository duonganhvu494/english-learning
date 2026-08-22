export const PLAN_FEATURE_KEYS = {
  CUSTOM_ROLES: 'custom_roles',
  QUIZ_ASSIGNMENTS: 'quiz_assignments',
  MAX_STUDENTS: 'max_students',
  MAX_CLASSES: 'max_classes',
} as const;

export type PlanFeatureKey =
  (typeof PLAN_FEATURE_KEYS)[keyof typeof PLAN_FEATURE_KEYS];