"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/providers/app-settings-provider";

export default function NotFound() {
  const { dictionary } = useAppSettings();

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-(--color-primary)">404</h1>
          <h2 className="text-2xl font-semibold text-app-text">
            {dictionary.appName} - {dictionary.notFound.title}
          </h2>
          <p className="text-app-text-muted">
            {dictionary.notFound.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary">
              <Home className="w-4 h-4 mr-2" />
              {dictionary.notFound.goHome}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {dictionary.notFound.backToDashboard}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
