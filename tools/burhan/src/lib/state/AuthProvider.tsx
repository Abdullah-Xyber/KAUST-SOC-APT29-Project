"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Mocked authentication. There is no backend in the exhibition build, so this
 * only gates navigation and remembers the session in localStorage — it is
 * intentionally the one place a real auth provider would be swapped in.
 */

export const DEMO_CREDENTIALS = { email: "admin@burhan.local", password: "burhan123" };

const STORAGE_KEY = "burhan.session";

interface AuthContextValue {
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string, remember: boolean) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = React.useState(false);
  const [isReady, setReady] = React.useState(false);

  React.useEffect(() => {
    const stored =
      window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    setAuthenticated(stored === "true");
    setReady(true);
  }, []);

  const login = React.useCallback((email: string, password: string, remember: boolean) => {
    if (email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
      return { ok: false, error: "Incorrect email or password. Use the demo credentials shown below." };
    }
    (remember ? window.localStorage : window.sessionStorage).setItem(STORAGE_KEY, "true");
    setAuthenticated(true);
    return { ok: true };
  }, []);

  const logout = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Redirects to /login when the session is missing. Renders nothing while checking. */
export function useRequireAuth() {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/login");
  }, [isReady, isAuthenticated, router]);

  return { isAuthenticated, isReady };
}
