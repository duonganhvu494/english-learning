"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type SubscriptionTier = "free" | "pro" | "enterprise";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  maxClasses: number;
  upgradeTier: (newTier: SubscriptionTier) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

const tierLimits = {
  free: { maxClasses: 3 },
  pro: { maxClasses: 10 },
  enterprise: { maxClasses: Infinity },
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>("free");

  const upgradeTier = (newTier: SubscriptionTier) => {
    setTier(newTier);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        maxClasses: tierLimits[tier].maxClasses,
        upgradeTier,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
