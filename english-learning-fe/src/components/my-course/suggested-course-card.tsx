"use client";

import type { SuggestedCourseKey, TeacherKey } from "@/mock-data/my-course";
import { useAppSettings } from "@/providers/app-settings-provider";

type SuggestedCourse = {
  id: number;
  titleKey: SuggestedCourseKey;
  teacherKey: TeacherKey;
};

export function SuggestedCourseCard({ course }: { course: SuggestedCourse }) {
  const { dictionary } = useAppSettings();
  const copy = dictionary.myCourse.suggested;

  return (
    <article className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-4 shadow-(--shadow-sm) transition hover:-translate-y-0.5 hover:shadow-(--shadow-md)">
      <div className="aspect-[1.28/1] rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-warning))]" />

      <h3 className="mt-4 line-clamp-2 min-h-14 text-[18px] font-bold leading-7 text-(--color-text)">
        {copy.courses[course.titleKey]}
      </h3>

      <div className="mt-3 inline-flex rounded-xl bg-(--color-surface-2) px-4 py-2 text-sm font-medium text-(--color-text-muted)">
        {copy.tagMain}
      </div>

      <div className="mt-4 space-y-3 text-[15px] text-(--color-text-muted)">
        <div className="flex items-center gap-2">
          <span>⚇</span>
          <span className="line-clamp-1">
            {copy.teachers[course.teacherKey]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>🗓</span>
          <span>{copy.durationThreeMonths}</span>
        </div>
      </div>

      <button className="mt-6 w-full rounded-2xl bg-(--color-primary) px-4 py-3 text-[16px] font-bold text-(--color-text-inverse) transition hover:bg-(--color-primary-hover)">
        {copy.consultButton}
      </button>
    </article>
  );
}
