import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface AuthUser {
  id: string;
  email?: string;
  google_user_data?: { name?: string; picture?: string };
}

interface AuthContextValue {
  user: AuthUser | null;
  isPending: boolean;
  logout: () => Promise<void>;
  redirectToLogin: () => void;
  exchangeCodeForSessionToken: () => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/users/me");
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetchMe().then(setUser).finally(() => setIsPending(false));
  }, []);

  const logout = async () => {
    await fetch("/api/logout");
    setUser(null);
    window.location.href = "/login";
  };

  const redirectToLogin = () => {
    window.location.href = "/login";
  };

  // Used by /auth/callback for traditional OAuth code flow (if re-implemented later)
  const exchangeCodeForSessionToken = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) throw new Error("No auth code in URL");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Failed to exchange code");
    const me = await fetchMe();
    if (me) {
      setUser(me);
      window.location.href = "/dashboard";
    }
  };

  // Called after Google One Tap returns a credential JWT
  const signInWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? "Sign in failed");
    }
    const me = await fetchMe();
    if (me) {
      setUser(me);
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPending, logout, redirectToLogin, exchangeCodeForSessionToken, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
