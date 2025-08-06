"use client";

import type { APIUser } from "discord-api-types/v10";
import { useEffect, useState } from "react";

// This interface defines the shape of the authentication state
interface AuthState {
  user: APIUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// This hook provides authentication state and methods for login/logout
export function useAuth(): AuthState & {
  login: (redirect?: string) => void;
  logout: (redirect?: string) => void;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (_error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loop dependency
  useEffect(() => {
    fetchUser();
  }, []);

  const login = (redirect?: string) => {
    window.location.href = `/api/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
  };

  const logout = (redirect?: string) => {
    window.location.href = `/api/auth/logout${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
  };

  const refetch = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await fetchUser();
  };

  return {
    ...state,
    login,
    logout,
    refetch,
  };
}
