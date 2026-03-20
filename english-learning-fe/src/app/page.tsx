"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { authApi } from "@/api";
import { useAppSettings } from "@/providers/app-settings-provider";

export default function Home() {
  const { dictionary } = useAppSettings();
  const router = useRouter();

  const [teacher, setTeacher] = useState<{
    userName: string;
    fullName: string;
    email: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      setIsLoading(true);
      try {
        const response = await authApi.me();
        if (!mounted) return;

        setTeacher(response.result);
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to fetch teacher profile:", error);
        setError(dictionary.myCourse.overview.loadError);
        router.push("/login");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <Header />

      <div className="container-app pt-20 pb-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-(--color-text)">
              {dictionary.appName}
            </h1>
            <p className="text-sm text-(--color-text-soft)">
              {dictionary.myCourse.breadcrumb.current}
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-center text-sm font-medium text-(--color-text-soft)">
            {dictionary.myCourse.overview.loading}
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
            {error}
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card
              title={`${dictionary.myCourse.overview.title}, ${teacher?.fullName ?? dictionary.myCourse.overview.profileTitle}`}
              description={dictionary.myCourse.overview.description}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <span className="text-sm font-semibold text-(--color-text-muted)">
                    {dictionary.myCourse.overview.profileFullName}
                  </span>
                  <span className="text-base font-medium text-(--color-text)">
                    {teacher?.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <span className="text-sm font-semibold text-(--color-text-muted)">
                    {dictionary.myCourse.overview.profileUserName}
                  </span>
                  <span className="text-base font-medium text-(--color-text)">
                    {teacher?.userName}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <span className="text-sm font-semibold text-(--color-text-muted)">
                    {dictionary.myCourse.overview.profileEmail}
                  </span>
                  <span className="text-base font-medium text-(--color-text)">
                    {teacher?.email}
                  </span>
                </div>
              </div>
            </Card>

            <Card
              title={dictionary.myCourse.overview.statsTitle}
              description={dictionary.myCourse.overview.description}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p className="text-xs uppercase tracking-wider text-(--color-text-soft)">
                    {dictionary.myCourse.overview.statsClasses}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-(--color-primary)">8</p>
                </div>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p className="text-xs uppercase tracking-wider text-(--color-text-soft)">
                    {dictionary.myCourse.overview.statsStudents}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-(--color-primary)">126</p>
                </div>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p className="text-xs uppercase tracking-wider text-(--color-text-soft)">
                    {dictionary.myCourse.overview.statsAssignments}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-(--color-primary)">34</p>
                </div>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p className="text-xs uppercase tracking-wider text-(--color-text-soft)">
                    {dictionary.myCourse.overview.statsTests}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-(--color-primary)">12</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
