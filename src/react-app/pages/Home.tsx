import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Users, Receipt, PieChart, Sparkles } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useAuth } from "@/react-app/context/AuthContext";
import { GsiInitializer, GoogleSignInButton } from "@/react-app/components/GoogleOneTap";

export default function HomePage() {
  const { user, isPending, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        setAuthError(null);
        await signInWithGoogle(credential);
      } catch (err) {
        setAuthError("Error al iniciar sesión. Intenta de nuevo.");
        console.error("Google sign-in error:", err);
      }
    },
    [signInWithGoogle]
  );

  const goToDashboard = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-onyx flex flex-col relative overflow-hidden">
      {!user && !isPending && <GsiInitializer onSuccess={handleGoogleCredential} />}

      {/* Aurora background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-radial from-iridescent-green/15 via-transparent to-transparent animate-aurora-pulse" />
        <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-gradient-radial from-iridescent-blue/15 via-transparent to-transparent animate-aurora-pulse" style={{ animationDelay: "-3s" }} />
        <div className="absolute -bottom-1/4 left-1/4 w-full h-full bg-gradient-radial from-iridescent-pink/10 via-transparent to-transparent animate-aurora-pulse" style={{ animationDelay: "-5s" }} />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png" alt="Split Fun" className="w-14 h-14" />
            <span className="text-3xl font-bold text-iridescent">Split Fun</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={goToDashboard} className="btn-iridescent">
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                    Más información
                  </Button>
                </Link>
                <div className="[&_iframe]:!min-h-[44px]">
                  <GoogleSignInButton id="google-signin-btn-header" />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-gold" />
            División de gastos simple y elegante
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Divide gastos sin{" "}
            <span className="text-iridescent">complicaciones</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Olvídate de las hojas de cálculo y los mensajes interminables. Gestiona gastos compartidos con amigos, familia o compañeros de forma clara y sencilla.
          </p>

          {authError && (
            <p className="text-sm text-red-400 text-center">{authError}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button size="lg" onClick={goToDashboard} className="btn-iridescent px-8 glow-iridescent">
                Entrar a mi cuenta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <>
                <div className="w-full sm:w-auto [&_iframe]:!min-h-[48px]">
                  <GoogleSignInButton id="google-signin-btn-hero" className="flex justify-center" />
                </div>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                    Ver más ventajas
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-2xl glass-card">
              <div className="w-12 h-12 rounded-xl bg-iridescent-green/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-iridescent-green" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Grupos ilimitados</h3>
              <p className="text-sm text-muted-foreground">
                Crea grupos para cada ocasión: hogar, viajes, parejas, amigos...
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card">
              <div className="w-12 h-12 rounded-xl bg-iridescent-blue/10 flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-iridescent-blue" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">División flexible</h3>
              <p className="text-sm text-muted-foreground">
                Divide por partes iguales, porcentajes o montos exactos.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card">
              <div className="w-12 h-12 rounded-xl bg-iridescent-pink/10 flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6 text-iridescent-pink" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Balances claros</h3>
              <p className="text-sm text-muted-foreground">
                Ve quién debe a quién de un vistazo. Sin confusiones.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Split Fun. Divide gastos sin drama.
        </div>
      </footer>
    </div>
  );
}
