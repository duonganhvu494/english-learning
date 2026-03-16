"use client";

import { useState } from "react";
import { useAppSettings } from "@/providers/app-settings-provider";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Breadcrumb } from "./breadcrumb";
import { EmptyCourseBanner } from "./empty-course-banner";
import { SuggestedCoursesSection } from "./suggested-courses-section";

export function MyCourseAppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { dictionary } = useAppSettings();

  return (
    <main className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <div className="grid min-h-screen lg:grid-cols-[312px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="min-w-0">
          <Topbar onOpenSidebar={() => setIsSidebarOpen(true)} />

          <div className="px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
            <Breadcrumb />

            <div className="mt-5 space-y-10">
              <EmptyCourseBanner />
              <SuggestedCoursesSection />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isSidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-(--color-overlay) transition-opacity ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
          role="button"
          tabIndex={isSidebarOpen ? 0 : -1}
          aria-label={dictionary.myCourse.topbar.closeMenu}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setIsSidebarOpen(false);
            }
          }}
        />

        <div
          className={`absolute top-0 left-0 h-full w-[min(86vw,312px)] transition-transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar mobile onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>
    </main>
  );
}
