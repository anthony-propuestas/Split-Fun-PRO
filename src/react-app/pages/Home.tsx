import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Users, Receipt, PieChart, Sparkles } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useAuth } from "@/react-app/context/AuthContext";
import { GoogleOneTap } from "@/react-app/components/GoogleOneTap";

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

  const openGoogleOneTap = () => {
    setAuthError(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const goToDashboard = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-onyx flex flex-col relative overflow-hidden">
      {/* Google One Tap: prompt automático en la primera página */}
      {!user && !isPending && (
        <GoogleOneTap onSuccess={handleGoogleCredential} />
      )}

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
                <Button onClick={openGoogleOneTap} className="btn-iridescent">
                  Continuar con Google
                </Button>
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
                <Button
                  size="lg"
                  onClick={openGoogleOneTap}
                  className="btn-iridescent px-8 glow-iridescent w-full sm:w-auto"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
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
