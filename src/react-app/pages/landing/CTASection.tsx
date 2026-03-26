import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useReveal } from "./useReveal";

interface CTASectionProps {
  onGetStarted: () => void;
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="relative z-10 py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div data-reveal className="glass-card rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">
          {/* Inner glow */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-iridescent-green/8 via-iridescent-blue/8 to-iridescent-pink/8 rounded-[2rem]"
            aria-hidden="true"
          />

          {/* Corner sparkle decoration */}
          <Sparkles
            className="absolute top-6 right-6 w-5 h-5 text-gold/30"
            aria-hidden="true"
          />
          <Sparkles
            className="absolute bottom-6 left-6 w-4 h-4 text-iridescent-pink/30"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              100% gratis para siempre
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
              ¿A qué estás
              <br />
              <span className="text-iridescent">esperando?</span>
            </h2>

            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Tu amigo que nunca paga ya está nervioso. Regístrate gratis y empieza
              a dividir gastos como un adulto... con memes.
            </p>

            <Button
              size="lg"
              onClick={onGetStarted}
              className="btn-iridescent glow-iridescent px-10 text-base font-bold"
            >
              Crear mi cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-muted-foreground/50">
              Sin tarjeta de crédito · Sin trucos · Don Barriga incluido 😈
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
