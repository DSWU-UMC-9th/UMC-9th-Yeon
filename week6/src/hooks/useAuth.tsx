/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

export type AuthContextType = {
  token: string | null;
  isAuthed: boolean;
  profile: any;
  setProfile: (p: any) => void;
  login: (token: string, profile: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "umc_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 새로고침/브라우저 재시작 후에도 유지하기 위해 localStorage 사용
  const [token, setToken] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token ?? null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<any>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.profile ?? null;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      isAuthed: !!token,
      profile,
      setProfile,
      login: (t, p) => {
        setToken(t);
        setProfile(p);
      },
      logout: () => {
        setToken(null);
        setProfile(null);
      },
    }),
    [token, profile]
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, profile }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
