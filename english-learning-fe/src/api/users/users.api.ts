import { httpClient } from "@/api/core/http-client";
import type { UpdateProfileRequest, UserProfile } from "@/types/auth";

export const usersApi = {
  updateMe: (payload: UpdateProfileRequest) =>
    httpClient.patch<UserProfile>("/users/me", payload),
};
