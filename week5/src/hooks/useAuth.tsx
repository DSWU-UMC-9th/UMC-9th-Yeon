/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useMemo, useState } from "react";

export type AuthContextType = {
  token: string | null;
  isAuthed: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 요구사항상 localStorage는 사용하지 않고 메모리에만 보관합니다.
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      isAuthed: !!token,
      login: (t) => setToken(t),
      logout: () => setToken(null),
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
