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

import { api } from "@/lib/api";
import type { SessionUser } from "@/types/api";

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ user: SessionUser }>; 
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const data = await api.get<{ authenticated: boolean; user: SessionUser; expiresAt: string }>(
        "/api/auth/session",
      );

      if (data.authenticated) {
        setUser(data.user);
        return;
      }

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: SessionUser; message: string; expiresAt: string }>(
      "/api/auth/login",
      { email, password },
    );

    setUser(data.user);
    return { user: data.user };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post<{ message: string }>("/api/auth/logout");
    } catch {
      // Ignore backend logout errors so the UI still clears the client session.
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, logout, refreshSession }),
    [user, ready, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
