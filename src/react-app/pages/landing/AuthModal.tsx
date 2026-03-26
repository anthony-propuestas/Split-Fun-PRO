import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Trophy, Users, Zap, Sparkles } from "lucide-react";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/react-app/components/ui/dialog";

type Mode = "login" | "register" | "forgot-password";

interface AuthModalProps {
  open: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
}

const registerFeatures = [
  { icon: Bell,   color: "text-amber-400",        title: "Don Barriga Mode",   desc: "Cobra con memes épicos" },
  { icon: Trophy, color: "text-gold",              title: "Sistema de Logros",  desc: "Gana medallas cobrando" },
  { icon: Users,  color: "text-iridescent-blue",   title: "Grupos Ilimitados",  desc: "Hogar, viajes, amigos" },
  { icon: Zap,    color: "text-iridescent-green",  title: "Balances al Instante", desc: "Sin calculadoras" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent-blue placeholder:text-muted-foreground/50";

export default function AuthModal({ open, initialMode, onClose }: AuthModalProps) {
  const { login, register, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sincronizar modo interno cuando el modal se abre desde afuera
  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  // Limpiar campos al cambiar de modo
  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setInfo(null);
    setLoading(false);
  }, [mode]);

  const handleClose = () => {
    // Resetear estado al cerrar
    setMode(initialMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setInfo(null);
    setLoading(false);
    onClose();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      setInfo("Cuenta creada. Revisa tu correo y verifica tu cuenta para poder iniciar sesión.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setInfo("Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el proceso de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent
        className="bg-zinc-950 border-white/10 sm:max-w-md p-0 overflow-hidden gap-0"
        showCloseButton
      >
        <div className="p-6 space-y-5">

          {/* ── REGISTER ── */}
          {mode === "register" && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    100% Gratis para siempre
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    ¡Únete a Split Fun!
                  </DialogTitle>
                  <DialogDescription>
                    La forma más divertida de dividir gastos 🎮
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* Features grid */}
              <div className="grid grid-cols-2 gap-2">
                {registerFeatures.map((f) => (
                  <div key={f.title} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <f.icon className={`w-4 h-4 ${f.color} flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{f.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form className="space-y-3" onSubmit={handleRegister}>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground" htmlFor="reg-email">
                    Correo electrónico
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground" htmlFor="reg-password">
                    Contraseña
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground" htmlFor="reg-confirm">
                    Repetir contraseña
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    className={inputClass}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                {info  && <p className="text-sm text-iridescent-green text-center">{info}</p>}

                <Button
                  type="submit"
                  className="w-full btn-iridescent mt-1"
                  disabled={loading || !!info}
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
                </Button>
              </form>

              <div className="text-center space-y-1 pt-1">
                <p className="text-xs text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    className="text-iridescent-blue hover:underline font-medium"
                    onClick={() => setMode("login")}
                  >
                    Inicia sesión
                  </button>
                </p>
                <p className="text-xs text-muted-foreground/50">
                  Al registrarte, aceptas que Don Barriga te persiga si debes dinero 😈
                </p>
              </div>
            </>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <>
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-bold text-foreground">
                  Inicia sesión
                </DialogTitle>
                <DialogDescription>
                  Entra con tu correo y contraseña para seguir dividiendo gastos.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-3" onSubmit={handleLogin}>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground" htmlFor="login-email">
                    Correo electrónico
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground" htmlFor="login-password">
                    Contraseña
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <Button type="submit" className="w-full btn-iridescent mt-1" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  className="text-xs text-iridescent-blue hover:underline"
                  onClick={() => setMode("forgot-password")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-xs text-muted-foreground">
                  ¿Aún no tienes cuenta?{" "}
                  <button
                    type="button"
                    className="text-iridescent-blue hover:underline font-medium"
                    onClick={() => setMode("register")}
                  >
                    Regístrate gratis
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot-password" && (
            <>
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-bold text-foreground">
                  Recuperar contraseña
                </DialogTitle>
                <DialogDescription>
                  Introduce tu correo y, si existe, te enviaremos un enlace para restablecerla.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-3" onSubmit={handleForgotPassword}>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground" htmlFor="forgot-email">
                    Correo electrónico
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                {info  && <p className="text-sm text-iridescent-green text-center">{info}</p>}

                <Button
                  type="submit"
                  className="w-full btn-iridescent mt-1"
                  disabled={loading || !!info}
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-iridescent-blue hover:underline"
                  onClick={() => setMode("login")}
                >
                  Volver a iniciar sesión
                </button>
              </div>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
