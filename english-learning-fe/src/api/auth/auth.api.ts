import { httpClient } from "@/api/core/http-client";
import type {
  LoginRequest,
  MeResponse,
  RegisterRequest,
  UserProfile,
} from "@/types/auth";

export const authApi = {
  login: (payload: LoginRequest) =>
    httpClient.post<UserProfile>("/auth/login", payload),
  register: (payload: RegisterRequest) =>
    httpClient.post<UserProfile>("/users/register", payload),
  refresh: () => httpClient.post<null>("/auth/refresh"),
  logout: () => httpClient.post<null>("/auth/logout"),
  me: () => httpClient.get<MeResponse>("/auth/me"),
};
