"use client";

import { CheckCircle, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UpgradeTier = "free" | "pro" | "enterprise";

type UpgradePlanCard = {
  name: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  badgeLabel?: string;
};

type PlanUpgradeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: (plan: "pro" | "enterprise") => void;
  currentTier?: UpgradeTier;
  title: string;
  description: string;
  cancelLabel: string;
  proPlan: UpgradePlanCard;
  enterprisePlan: UpgradePlanCard;
};

export function PlanUpgradeDialog({
  open,
  onOpenChange,
  onUpgrade,
  currentTier = "free",
  title,
  description,
  cancelLabel,
  proPlan,
  enterprisePlan,
}: PlanUpgradeDialogProps) {
  const canUpgradeToPro = currentTier !== "pro" && currentTier !== "enterprise";
  const canUpgradeToEnterprise = currentTier !== "enterprise";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-app-border bg-app-surface">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 md:grid-cols-2">
          {canUpgradeToPro ? (
            <Card className="border-2 border-(--color-primary)">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-(--color-primary)" />
                    <CardTitle>{proPlan.name}</CardTitle>
                  </div>
                  {proPlan.badgeLabel ? <Badge>{proPlan.badgeLabel}</Badge> : null}
                </div>
                <CardDescription className="mt-2">
                  <span className="text-2xl font-semibold text-(--color-primary)">
                    {proPlan.price}
                  </span>
                  <span className="ml-1 text-sm text-app-text-muted">
                    {proPlan.period}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {proPlan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-app-text">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    onUpgrade("pro");
                    onOpenChange(false);
                  }}
                >
                  {proPlan.ctaLabel}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {canUpgradeToEnterprise ? (
            <Card className="border-app-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-(--color-warning)" />
                  <CardTitle>{enterprisePlan.name}</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  <span className="text-2xl font-semibold text-(--color-warning)">
                    {enterprisePlan.price}
                  </span>
                  <span className="ml-1 text-sm text-app-text-muted">
                    {enterprisePlan.period}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {enterprisePlan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-app-text">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onUpgrade("enterprise");
                    onOpenChange(false);
                  }}
                >
                  {enterprisePlan.ctaLabel}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
