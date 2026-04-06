"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/types";
import type { BillingPlanDetail } from "@/components/billing/billing-types";

type BillingPaymentDialogProps = {
  dictionary: Dictionary["billingPage"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: "pro" | "enterprise";
  planDetail: BillingPlanDetail;
  onComplete: () => void;
};

type PaymentFormState = {
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholderName: string;
};

const DEFAULT_PAYMENT_FORM: PaymentFormState = {
  cardNumber: "",
  expiry: "",
  cvc: "",
  cardholderName: "",
};

export function BillingPaymentDialog({
  dictionary,
  open,
  onOpenChange,
  selectedPlan,
  planDetail,
  onComplete,
}: BillingPaymentDialogProps) {
  const [formData, setFormData] = useState<PaymentFormState>(DEFAULT_PAYMENT_FORM);

  const description = useMemo(
    () =>
      dictionary.paymentDialogDescription
        .replace("{plan}", planDetail.name)
        .replace("{price}", planDetail.price)
        .replace("{period}", planDetail.period),
    [dictionary.paymentDialogDescription, planDetail.name, planDetail.period, planDetail.price],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void selectedPlan;
    onComplete();
    setFormData(DEFAULT_PAYMENT_FORM);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-app-border bg-app-surface">
        <DialogHeader>
          <DialogTitle>{dictionary.paymentDialogTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card-number">{dictionary.cardNumberLabel}</Label>
              <Input
                id="card-number"
                value={formData.cardNumber}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, cardNumber: event.target.value }))
                }
                placeholder={dictionary.cardNumberPlaceholder}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="card-expiry">{dictionary.expiryLabel}</Label>
                <Input
                  id="card-expiry"
                  value={formData.expiry}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, expiry: event.target.value }))
                  }
                  placeholder={dictionary.expiryPlaceholder}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-cvc">{dictionary.cvcLabel}</Label>
                <Input
                  id="card-cvc"
                  value={formData.cvc}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, cvc: event.target.value }))
                  }
                  placeholder={dictionary.cvcPlaceholder}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cardholder-name">{dictionary.cardholderNameLabel}</Label>
              <Input
                id="cardholder-name"
                value={formData.cardholderName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, cardholderName: event.target.value }))
                }
                placeholder={dictionary.cardholderNamePlaceholder}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {dictionary.cancel}
            </Button>
            <Button type="submit">{dictionary.completeUpgrade}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
