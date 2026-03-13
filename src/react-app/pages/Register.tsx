import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import { GoogleOneTap } from "@/react-app/components/GoogleOneTap";
import { Button } from "@/react-app/components/ui/button";
import { Bell, Trophy, Users, Zap, Sparkles } from "lucide-react";

export default function Register() {
  const { user, isPending, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        setAuthError(null);
        await signInWithGoogle(credential);
      } catch (err) {
        setAuthError("Error al crear cuenta. Intenta de nuevo.");
        console.error("Google sign-in error:", err);
      }
    },
    [signInWithGoogle]
  );

  const openGoogleOneTap = () => {
    setAuthError(null);
    window.google?.accounts?.id?.prompt();
  };

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
      {!user && !isPending && <GoogleOneTap onSuccess={handleGoogleCredential} />}

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

            {authError && <p className="text-sm text-red-400 text-center">{authError}</p>}
            <Button
              onClick={openGoogleOneTap}
              className="w-full h-12 btn-iridescent glow-iridescent"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Crear cuenta con Google
            </Button>

            <div className="text-center space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/" className="text-iridescent-blue hover:underline font-medium">
                  Volver al inicio
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
