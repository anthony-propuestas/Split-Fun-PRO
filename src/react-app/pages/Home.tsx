import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useAuth } from "@/react-app/context/AuthContext";

import InteractiveBackground from "./landing/InteractiveBackground";
import HeroSection from "./landing/HeroSection";
import HowItWorksSection from "./landing/HowItWorksSection";
import GamificationSection from "./landing/GamificationSection";
import CTASection from "./landing/CTASection";
import AuthModal from "./landing/AuthModal";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("register");

  // Abrir modal automáticamente si venimos de un redirect con state (e.g. /login → /)
  useEffect(() => {
    const state = location.state as { modal?: string } | null;
    if (state?.modal === "login" || state?.modal === "register") {
      setModalMode(state.modal as "login" | "register");
      setModalOpen(true);
      // Limpiar el state de la URL sin provocar un re-render
      window.history.replaceState({}, "", "/");
    }
  }, []); // solo al montar

  const handleGetStarted = () => { setModalMode("register"); setModalOpen(true); };
  const handleLogin      = () => { setModalMode("login");    setModalOpen(true); };
  const goToDashboard    = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-onyx text-foreground relative">
      <InteractiveBackground />

      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-onyx/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png"
              alt="Split Fun"
              className="w-9 h-9"
            />
            <span className="text-xl font-bold text-iridescent">Split Fun</span>
          </div>

          {user ? (
            <Button onClick={goToDashboard} size="sm" className="btn-iridescent">
              Ir al Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogin}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                Entrar
              </Button>
              <Button size="sm" onClick={handleGetStarted} className="btn-iridescent">
                Registro gratis
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Page content — offset for fixed header (~61px) */}
      <main className="pt-[61px]">
        {user ? (
          /* Already logged in — simple redirect prompt */
          <div className="min-h-[calc(100svh-61px)] flex items-center justify-center px-4">
            <div className="text-center space-y-6">
              <div className="text-6xl">👋</div>
              <h1 className="text-3xl font-bold text-foreground">¡Ya estás dentro!</h1>
              <p className="text-muted-foreground">Tu cuenta Split Fun está esperando.</p>
              <Button
                onClick={goToDashboard}
                className="btn-iridescent glow-iridescent px-8"
                size="lg"
              >
                Ir al Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <HeroSection onGetStarted={handleGetStarted} onLogin={handleLogin} />
            <HowItWorksSection />
            <GamificationSection />
            <CTASection onGetStarted={handleGetStarted} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png"
              alt="Split Fun"
              className="w-5 h-5 opacity-70"
            />
            <span className="font-medium">Split Fun</span>
          </div>
          <p>© 2024 Split Fun · Divide gastos sin dividir amistades.</p>
        </div>
      </footer>

      {/* Auth modal — controlado desde este componente */}
      <AuthModal
        open={modalOpen}
        initialMode={modalMode}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
