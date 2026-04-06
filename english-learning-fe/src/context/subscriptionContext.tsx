"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { workspacesApi } from "@/api";
import { useAuth } from "@/providers/auth-provider";
import type { WorkspaceSubscription } from "@/types/workspace";

export type SubscriptionTier = "free" | "pro" | "enterprise";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  maxClasses: number;
  upgradeTier: (newTier: SubscriptionTier) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

const MAX_CLASSES_FEATURE_KEY = "max_classes";

const tierLimits: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 10,
  enterprise: Infinity,
};

const planCodeTierMap: Record<string, SubscriptionTier> = {
  free: "free",
  starter: "pro",
  pro: "enterprise",
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeWorkspaceId } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [maxClasses, setMaxClasses] = useState<number>(tierLimits.free);

  const resolveTierFromPlanCode = useCallback((planCode: string) => {
    return planCodeTierMap[planCode] ?? "free";
  }, []);

  const resolveMaxClassesFromSubscription = useCallback(
    (subscription: WorkspaceSubscription, fallbackTier: SubscriptionTier) => {
      const maxClassesFeature = subscription.plan.features.find(
        (feature) =>
          feature.featureKey === MAX_CLASSES_FEATURE_KEY &&
          feature.valueType === "number" &&
          typeof feature.value === "number" &&
          Number.isFinite(feature.value),
      );

      if (maxClassesFeature && typeof maxClassesFeature.value === "number") {
        return Math.max(0, maxClassesFeature.value);
      }

      return tierLimits[fallbackTier];
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated || !activeWorkspaceId) {
      return;
    }

    let isCancelled = false;

    const loadSubscription = async () => {
      try {
        const response = await workspacesApi.myWorkspaceSubscription();
        if (isCancelled) {
          return;
        }

        const nextTier = resolveTierFromPlanCode(response.result.plan.code);
        const nextMaxClasses = resolveMaxClassesFromSubscription(
          response.result,
          nextTier,
        );

        setTier(nextTier);
        setMaxClasses(nextMaxClasses);
      } catch {
        if (!isCancelled) {
          setTier("free");
          setMaxClasses(tierLimits.free);
        }
      }
    };

    void loadSubscription();

    return () => {
      isCancelled = true;
    };
  }, [
    activeWorkspaceId,
    isAuthenticated,
    resolveMaxClassesFromSubscription,
    resolveTierFromPlanCode,
  ]);

  const upgradeTier = (newTier: SubscriptionTier) => {
    setTier(newTier);
    setMaxClasses(tierLimits[newTier]);
  };

  const value = useMemo(
    () => ({
      tier: isAuthenticated && activeWorkspaceId ? tier : "free",
      maxClasses:
        isAuthenticated && activeWorkspaceId ? maxClasses : tierLimits.free,
      upgradeTier,
    }),
    [activeWorkspaceId, isAuthenticated, maxClasses, tier],
  );

  return (
    <SubscriptionContext.Provider value={value}>
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
