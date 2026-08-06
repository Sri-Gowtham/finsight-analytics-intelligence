import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { Role, User } from "./types";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  /** false until localStorage has been read on the client */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    setUser(api.currentUserSync());
    setReady(true);
  }, []);

  const refresh = useCallback(() => setUser(api.currentUserSync()), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await api.login(email, password);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await api.logout();
    setUser(null);
    router.navigate({ to: "/login", replace: true });
  }, [router, qc]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, ready, signIn, signOut, refresh }),
    [user, ready, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const HOME_FOR_ROLE: Record<Role, string> = {
  analyst: "/dashboard",
  cfo: "/approvals",
  admin: "/admin",
};
