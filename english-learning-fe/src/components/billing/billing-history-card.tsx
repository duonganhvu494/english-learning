"use client";

import { Calendar, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dictionary } from "@/i18n/types";
import type { BillingHistoryItem, BillingTier } from "@/components/billing/billing-types";

type BillingHistoryCardProps = {
  dictionary: Dictionary["billingPage"];
  tier: BillingTier;
  history: BillingHistoryItem[];
  localeTag: string;
  onDownloadAll: () => void;
  onDownloadOne: (invoice: BillingHistoryItem) => void;
};

export function BillingHistoryCard({
  dictionary,
  tier,
  history,
  localeTag,
  onDownloadAll,
  onDownloadOne,
}: BillingHistoryCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{dictionary.billingHistoryTitle}</CardTitle>
          <Button type="button" variant="outline" size="sm" className="w-auto" onClick={onDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            {dictionary.downloadAll}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tier === "free" ? (
          <div className="py-8 text-center text-app-text-muted">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-app-text-soft" />
            <p>{dictionary.noBillingHistory}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-app-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-app-text">{invoice.description}</div>
                  <div className="text-sm text-app-text-muted">
                    {new Date(invoice.date).toLocaleDateString(localeTag, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-app-text">{invoice.amount}</div>
                    <Badge variant="outline">{invoice.status}</Badge>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-auto px-3" onClick={() => onDownloadOne(invoice)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
