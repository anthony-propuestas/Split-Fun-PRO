import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-onyx flex flex-col relative overflow-hidden">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-foreground">Inicia sesión</h1>
              <p className="text-sm text-muted-foreground">
                Entra con tu correo y contraseña para seguir dividiendo gastos.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <label className="block text-sm font-medium text-foreground" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-sm font-medium text-foreground" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <Button
                type="submit"
                className="w-full btn-iridescent"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <button
                type="button"
                className="text-xs text-iridescent-blue hover:underline"
                onClick={() => navigate("/forgot-password")}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <p className="text-xs text-muted-foreground">
                ¿Aún no tienes cuenta?{" "}
                <Link to="/register" className="text-iridescent-blue hover:underline font-medium">
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

