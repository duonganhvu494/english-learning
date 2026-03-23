import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSettingsProvider } from "@/providers/app-settings-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { cn } from "@/utils/cn";
import "./globals.css";
import { DataProvider } from "@/mock-data/dataContext";
import { SubscriptionProvider } from "@/context/subscriptionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Learning FE",
  description:
    "Frontend foundation with theme tokens and locale-ready architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <AppSettingsProvider>
          <SubscriptionProvider>
            <DataProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </DataProvider>
          </SubscriptionProvider>
        </AppSettingsProvider>
      </body>
    </html>
  );
}
