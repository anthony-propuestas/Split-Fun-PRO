import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import { GsiInitializer, GoogleSignInButton } from "@/react-app/components/GoogleOneTap";
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
      {!user && !isPending && <GsiInitializer onSuccess={handleGoogleCredential} />}

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
            <div className="w-full [&_iframe]:!min-h-[48px] flex justify-center">
              <GoogleSignInButton id="google-signin-btn-register" />
            </div>

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
