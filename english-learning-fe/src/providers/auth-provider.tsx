"use client";

import { authApi, workspacesApi } from "@/api";
import type { ApiResponse } from "@/api/core/api-types";
import type { WorkspaceMembership } from "@/api/workspaces/workspaces.api";
import type { LoginRequest, MeResponse, UserProfile } from "@/types/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id?: string;
  userName: string;
  fullName: string;
  email: string;
};

type AuthContextType = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  workspaces: WorkspaceMembership[];
  activeWorkspaceId: string | null;
  login: (payload: LoginRequest) => Promise<ApiResponse<UserProfile>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapToAuthUser(user: Partial<UserProfile | MeResponse>): AuthUser {
  return {
    id: typeof user.id === "string" ? user.id : undefined,
    userName: typeof user.userName === "string" ? user.userName : "",
    fullName: typeof user.fullName === "string" ? user.fullName : "",
    email: typeof user.email === "string" ? user.email : "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );

  const applyWorkspaceState = useCallback((next: WorkspaceMembership[]) => {
    setWorkspaces(next);
    setActiveWorkspaceId((current) => {
      if (current && next.some((workspace) => workspace.workspaceId === current)) {
        return current;
      }

      return next[0]?.workspaceId ?? null;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      const nextUser = mapToAuthUser(response.result);
      let memberships: WorkspaceMembership[] = [];

      try {
        const workspaceResponse = await workspacesApi.myWorkspaces();
        memberships = workspaceResponse.result ?? [];
      } catch {
        memberships = [];
      }

      setUser(nextUser);
      applyWorkspaceState(memberships);
      setStatus("authenticated");
      return nextUser;
    } catch {
      setUser(null);
      applyWorkspaceState([]);
      setStatus("unauthenticated");
      return null;
    }
  }, [applyWorkspaceState]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authApi.login(payload);
    const nextUser = mapToAuthUser(response.result);
    let memberships: WorkspaceMembership[] = [];

    try {
      const workspaceResponse = await workspacesApi.myWorkspaces();
      memberships = workspaceResponse.result ?? [];
    } catch {
      memberships = [];
    }

    setUser(nextUser);
    applyWorkspaceState(memberships);
    setStatus("authenticated");
    return response;
  }, [applyWorkspaceState]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      applyWorkspaceState([]);
      setStatus("unauthenticated");
    }
  }, [applyWorkspaceState]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && user !== null,
      workspaces,
      activeWorkspaceId,
      login,
      logout,
      refreshUser,
    }),
    [
      activeWorkspaceId,
      login,
      logout,
      refreshUser,
      status,
      user,
      workspaces,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
