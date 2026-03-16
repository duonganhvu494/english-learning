import { httpClient } from "@/api/core/http-client";
import type {
  LoginRequest,
  MeResponse,
  UserProfile,
} from "@/api/auth/auth.types";

export const authApi = {
  login: (payload: LoginRequest) => httpClient.post<UserProfile>("/auth/login", payload),
  refresh: () => httpClient.post<null>("/auth/refresh"),
  logout: () => httpClient.post<null>("/auth/logout"),
  me: () => httpClient.get<MeResponse>("/auth/me"),
};
