"use client";

export type BillingTier = "free" | "pro" | "enterprise";

export type BillingPlanDetail = {
  name: string;
  price: string;
  period: string;
  maxClasses: number;
  accentClassName: string;
  features: string[];
};

export type BillingHistoryItem = {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
};
