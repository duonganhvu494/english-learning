"use client";

import { useAppSettings } from "@/providers/app-settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UpgradePlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: (tier: "pro" | "enterprise") => void;
  maxClasses: number;
};

export function UpgradePlanDialog({
  open,
  onOpenChange,
  onUpgrade,
  maxClasses,
}: UpgradePlanDialogProps) {
  const { dictionary } = useAppSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dictionary.dashboard.upgradeDialogTitle}</DialogTitle>
          <DialogDescription>
            {dictionary.dashboard.upgradeDialogDescription.replace(
              "{maxClasses}",
              String(maxClasses),
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex h-full flex-col border-2 border-app-border/70 bg-app-surface-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{dictionary.dashboard.proPlanTitle}</CardTitle>
                <Badge>{dictionary.landing.pricing.mostPopular}</Badge>
              </div>
              <CardDescription className="text-2xl font-semibold text-app-text">
                {dictionary.dashboard.planPrice}
                <span className="text-sm font-normal text-app-text-muted">
                  {dictionary.dashboard.planPeriod}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-3">
              <p>{dictionary.dashboard.planBenefits}</p>
              <ul className="flex-1 list-disc space-y-2 pl-5 text-app-text-muted">
                <li>{dictionary.dashboard.upgradeBenefit1}</li>
                <li>{dictionary.dashboard.upgradeBenefit2}</li>
                <li>{dictionary.dashboard.upgradeBenefit3}</li>
              </ul>
              <Button
                className="mt-auto w-full"
                onClick={() => {
                  onUpgrade("pro");
                  onOpenChange(false);
                }}
              >
                {dictionary.dashboard.upgradeProCta}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col bg-app-surface-2">
            <CardHeader>
              <CardTitle>{dictionary.dashboard.enterprisePlanTitle}</CardTitle>
              <CardDescription className="text-2xl font-semibold text-app-text">
                {dictionary.dashboard.enterprisePlanPrice}
                <span className="text-sm font-normal text-app-text-muted">
                  {dictionary.dashboard.planPeriod}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-3">
              <p>{dictionary.dashboard.enterprisePlanBenefits}</p>
              <ul className="flex-1 list-disc space-y-2 pl-5 text-app-text-muted">
                <li>{dictionary.dashboard.enterpriseBenefit1}</li>
                <li>{dictionary.dashboard.enterpriseBenefit2}</li>
                <li>{dictionary.dashboard.enterpriseBenefit3}</li>
              </ul>
              <Button
                variant="outline"
                className="mt-auto w-full"
                onClick={() => {
                  onUpgrade("enterprise");
                  onOpenChange(false);
                }}
              >
                {dictionary.dashboard.upgradeEnterpriseCta}
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {dictionary.dashboard.createDialogCancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
