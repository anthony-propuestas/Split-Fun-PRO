import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import { Bell, Trophy, Users, Zap, Sparkles } from "lucide-react";

export default function Register() {
  const { user, isPending, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isPending) {
      navigate("/dashboard");
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-iridescent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: Bell,
      title: "Don Barriga Mode",
      description: "Cobra con memes épicos",
      color: "text-amber-400",
    },
    {
      icon: Trophy,
      title: "Sistema de Logros",
      description: "Gana medallas cobrando",
      color: "text-gold",
    },
    {
      icon: Users,
      title: "Grupos Ilimitados",
      description: "Hogar, viajes, amigos",
      color: "text-iridescent-blue",
    },
    {
      icon: Zap,
      title: "Balances al Instante",
      description: "Sin calculadoras",
      color: "text-iridescent-green",
    },
  ];

  return (
    <div className="min-h-screen bg-onyx flex flex-col relative overflow-hidden">
      {/* Aurora background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-radial from-iridescent-green/15 via-transparent to-transparent animate-aurora-pulse" />
        <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-gradient-radial from-iridescent-blue/15 via-transparent to-transparent animate-aurora-pulse" style={{ animationDelay: '-3s' }} />
        <div className="absolute -bottom-1/4 left-1/4 w-full h-full bg-gradient-radial from-iridescent-pink/10 via-transparent to-transparent animate-aurora-pulse" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png" alt="Split Fun" className="w-10 h-10" />
            <span className="text-xl font-bold text-iridescent">Split Fun</span>
          </Link>
        </div>
      </header>

      {/* Register form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4">
                <img 
                  src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png" 
                  alt="Split Fun" 
                  className="w-full h-full"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                100% Gratis para siempre
              </div>
              <h1 className="text-2xl font-bold text-foreground">¡Únete a Split Fun!</h1>
              <p className="text-muted-foreground mt-1">La forma más divertida de dividir gastos 🎮</p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-3 py-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <feature.icon className={`w-4 h-4 ${feature.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{feature.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="space-y-4 pt-2"
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                setError(null);
                setInfo(null);
                if (password !== confirmPassword) {
                  setError("Las contraseñas no coinciden.");
                  return;
                }
                try {
                  await register(email, password);
                  setInfo(
                    "Cuenta creada. Revisa tu correo y verifica tu cuenta para poder iniciar sesión."
                  );
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "No se pudo crear la cuenta.";
                  setError(message);
                }
              }}
            >
              <div className="space-y-2 text-left">
                <label className="block text-sm font-medium text-foreground" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
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
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
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
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-iridescent"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              {info && <p className="text-sm text-iridescent-green text-center">{info}</p>}

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-200 text-black text-sm font-medium hover:bg-zinc-300 transition"
              >
                Crear cuenta gratis
              </button>
            </form>

            <div className="text-center space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-iridescent-blue hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
              <p className="text-xs text-muted-foreground/60">
                Al registrarte, aceptas que Don Barriga te persiga si debes dinero 😈
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
