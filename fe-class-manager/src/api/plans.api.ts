import type { PlanResponse } from "@/types";

import { http, unwrap } from "./http";

export const plansApi = {
  async getPlans(): Promise<PlanResponse[]> {
    return unwrap<PlanResponse[]>(
      http.get("/plans"),
    );
  },
};