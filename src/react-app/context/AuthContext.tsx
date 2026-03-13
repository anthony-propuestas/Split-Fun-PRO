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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<AuthUser | null> {
  try {
    console.log("[Auth] fetchMe: starting request to /api/users/me");
    const res = await fetch("/api/users/me");
    console.log("[Auth] fetchMe: response", {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
    });
    if (!res.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await res.json();
      } catch {
        // ignore JSON parse error
      }
      console.warn("[Auth] fetchMe: non-OK response body", errorBody);
      return null;
    }
    const data = (await res.json()) as AuthUser;
    console.log("[Auth] fetchMe: parsed user", data);
    return data;
  } catch (e) {
    console.error("[Auth] fetchMe: network or unexpected error", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    // Solo intentamos recuperar la sesión si ya existe la cookie de sesión.
    // Esto evita llamadas 401 "normales" cuando el usuario nunca ha iniciado sesión.
    const hasSessionCookie =
      typeof document !== "undefined" &&
      document.cookie.split(";").some((c) => c.trim().startsWith("sf_session="));

    console.log("[Auth] initial effect: hasSessionCookie =", hasSessionCookie);

    if (!hasSessionCookie) {
      setIsPending(false);
      return;
    }

    fetchMe()
      .then((me) => {
        console.log("[Auth] initial fetchMe result", me);
        setUser(me);
      })
      .finally(() => {
        console.log("[Auth] initial fetchMe finished, clearing isPending");
        setIsPending(false);
      });
  }, []);

  const logout = async () => {
    console.log("[Auth] logout: calling /api/logout");
    await fetch("/api/logout");
    setUser(null);
    console.log("[Auth] logout: redirecting to /");
    window.location.href = "/";
  };

  const redirectToLogin = () => {
    console.log("[Auth] redirectToLogin: redirecting to /");
    window.location.href = "/";
  };

  const login = useCallback(
    async (email: string, password: string) => {
      console.log("[Auth] login: POST /api/auth/login");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        const code = body?.error as string | undefined;
        const message =
          code === "EMAIL_NOT_VERIFIED"
            ? "Debes verificar tu correo antes de iniciar sesión."
            : body?.message || "Correo o contraseña incorrectos.";
        throw new Error(message);
      }
      const me = await fetchMe();
      setUser(me);
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string) => {
      console.log("[Auth] register: POST /api/auth/register");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        throw new Error(body?.message || "No se pudo crear la cuenta.");
      }
      // No iniciamos sesión automáticamente: requerimos verificación de correo.
    },
    []
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    console.log("[Auth] requestPasswordReset: POST /api/auth/forgot-password");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore
      }
      throw new Error(body?.message || "No se pudo iniciar el proceso de recuperación.");
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    console.log("[Auth] resetPassword: POST /api/auth/reset-password");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: newPassword }),
    });
    if (!res.ok) {
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore
      }
      throw new Error(body?.message || "No se pudo restablecer la contraseña.");
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    console.log("[Auth] resendVerification: POST /api/auth/resend-verification");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore
      }
      throw new Error(body?.message || "No se pudo reenviar el correo de verificación.");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isPending,
        logout,
        redirectToLogin,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}