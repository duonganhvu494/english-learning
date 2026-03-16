"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/providers/app-settings-provider";

type PageTitleProps = {
  page: "login" | "signUp";
};

export function PageTitle({ page }: PageTitleProps) {
  const { dictionary } = useAppSettings();

  useEffect(() => {
    const titles = {
      login: dictionary.login.formTitle,
      signUp: dictionary.signUp.formTitle,
    };
    document.title = `${titles[page]} - ${dictionary.appName}`;
  }, [page, dictionary]);

  return null;
}
