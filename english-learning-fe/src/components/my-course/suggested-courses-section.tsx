"use client";

import { suggestedCourses } from "@/data/my-course";
import { useAppSettings } from "@/providers/app-settings-provider";
import { SuggestedCourseCard } from "./suggested-course-card";

export function SuggestedCoursesSection() {
  const { dictionary } = useAppSettings();

  return (
    <section>
      <h2 className="text-[22px] font-bold text-(--color-text)">
        {dictionary.myCourse.suggested.title}
      </h2>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {suggestedCourses.map((course) => (
          <SuggestedCourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
