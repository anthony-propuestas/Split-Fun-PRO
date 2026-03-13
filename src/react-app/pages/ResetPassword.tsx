import { FormEvent, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!token) {
      setError("El enlace no es válido.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setInfo("Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo restablecer la contraseña.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-onyx flex flex-col relative overflow-hidden">
      <header className="border-b border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png"
              alt="Split Fun"
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-iridescent">Split Fun</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
              <p className="text-sm text-muted-foreground">
                Elige una nueva contraseña para tu cuenta.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <label className="block text-sm font-medium text-foreground" htmlFor="password">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <label
                  className="block text-sm font-medium text-foreground"
                  htmlFor="confirmPassword"
                >
                  Repetir contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              {info && <p className="text-sm text-iridescent-green text-center">{info}</p>}

              <Button type="submit" className="w-full btn-iridescent" disabled={loading}>
                {loading ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              <Link to="/login" className="text-iridescent-blue hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

