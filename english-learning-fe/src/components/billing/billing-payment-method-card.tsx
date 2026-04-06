"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dictionary } from "@/i18n/types";
import type { BillingTier } from "@/components/billing/billing-types";

type BillingPaymentMethodCardProps = {
  dictionary: Dictionary["billingPage"];
  tier: BillingTier;
  onUpdatePaymentMethod: () => void;
};

export function BillingPaymentMethodCard({
  dictionary,
  tier,
  onUpdatePaymentMethod,
}: BillingPaymentMethodCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle>{dictionary.paymentMethodTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tier === "free" ? (
          <div className="py-6 text-center text-app-text-muted">
            <CreditCard className="mx-auto mb-3 h-12 w-12 text-app-text-soft" />
            <p className="text-sm">{dictionary.noPaymentMethodDescription}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-app-border p-4">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-purple-600">
                <CreditCard className="h-5 w-5 text-(--color-text-inverse)" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-app-text">{dictionary.mockCardNumber}</div>
                <div className="text-sm text-app-text-muted">{dictionary.mockCardExpiry}</div>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onUpdatePaymentMethod}>
              {dictionary.updatePaymentMethod}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
