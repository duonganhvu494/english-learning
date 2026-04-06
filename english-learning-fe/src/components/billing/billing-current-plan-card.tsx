"use client";

import {
  AlertCircle,
  CheckCircle,
  Crown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Dictionary } from "@/i18n/types";
import type { BillingPlanDetail, BillingTier } from "@/components/billing/billing-types";

type BillingCurrentPlanCardProps = {
  dictionary: Dictionary["billingPage"];
  tier: BillingTier;
  currentPlan: BillingPlanDetail;
  classesCount: number;
  maxClasses: number;
  usagePercentage: number;
  usageText: string;
  nextBillingDateText: string;
  onOpenUpgrade: () => void;
  onCancelSubscription: () => void;
};

export function BillingCurrentPlanCard({
  dictionary,
  tier,
  currentPlan,
  classesCount,
  maxClasses,
  usagePercentage,
  usageText,
  nextBillingDateText,
  onOpenUpgrade,
  onCancelSubscription,
}: BillingCurrentPlanCardProps) {
  return (
    <Card className="border-app-border bg-app-surface lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {tier === "enterprise" ? (
                <Crown className="h-6 w-6 text-(--color-warning)" />
              ) : null}
              {tier === "pro" ? (
                <Zap className="h-6 w-6 text-(--color-primary)" />
              ) : null}
              {currentPlan.name}
            </CardTitle>
            <CardDescription className="mt-2">
              <span className={`text-2xl font-semibold ${currentPlan.accentClassName}`}>
                {currentPlan.price}
              </span>
              <span className="ml-2 text-app-text-muted">{currentPlan.period}</span>
            </CardDescription>
          </div>
          <Badge variant={tier === "free" ? "secondary" : "default"}>
            {tier === "free" ? dictionary.statusFree : dictionary.statusActive}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-app-text">
              {dictionary.classUsageLabel}
            </span>
            <span className="text-sm text-app-text-muted">{usageText}</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          {maxClasses !== Infinity && classesCount / Math.max(1, maxClasses) >= 0.8 ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-(--color-warning)">
              <AlertCircle className="h-4 w-4" />
              {dictionary.approachingLimit}
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="mb-3 font-medium text-app-text">{dictionary.planFeaturesTitle}</h3>
          <ul className="space-y-2">
            {currentPlan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-app-text">
                <CheckCircle className="h-4 w-4 text-(--color-success)" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {tier !== "enterprise" ? (
          <div className="border-t border-app-border pt-4">
            <Button type="button" className="w-full" onClick={onOpenUpgrade}>
              <TrendingUp className="mr-2 h-4 w-4" />
              {dictionary.upgradePlan}
            </Button>
          </div>
        ) : null}

        {tier !== "free" ? (
          <div className="pt-2">
            <p className="mb-2 text-sm text-app-text-muted">{nextBillingDateText}</p>
            <Button type="button" variant="outline" className="w-full" onClick={onCancelSubscription}>
              {dictionary.cancelSubscription}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
