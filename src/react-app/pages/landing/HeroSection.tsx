import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface HeroSectionProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const stats = [
  { value: "∞", label: "grupos gratis" },
  { value: "0€", label: "para siempre" },
  { value: "😈", label: "Don Barriga incluido" },
];

export default function HeroSection({ onGetStarted, onLogin }: HeroSectionProps) {
  return (
    <section className="relative z-10 min-h-[calc(100svh-61px)] flex flex-col items-center justify-center px-4 py-20 text-center">
      {/* Badge — delay 0s */}
      <div
        className="hero-animate inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground mb-8"
        style={{ animationDelay: "0s" }}
      >
        <Sparkles className="w-4 h-4 text-gold" />
        100% gratis · Divide gastos con estilo&nbsp;🎮
      </div>

      {/* Headline — delay 0.1s */}
      <h1
        className="hero-animate text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-foreground leading-[1.05] tracking-tight mb-6 max-w-4xl"
        style={{ animationDelay: "0.1s" }}
      >
        Divide gastos
        <br />
        <span className="text-iridescent">sin dividir</span>
        <br />
        amistades.
      </h1>

      {/* Subheadline — delay 0.2s */}
      <p
        className="hero-animate text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
        style={{ animationDelay: "0.2s" }}
      >
        Olvídate del Excel interminable y del amigo que{" "}
        <em className="not-italic text-foreground/80">"ya te pago"</em>. Split Fun hace el
        trabajo sucio por ti — con humor incluido.
      </p>

      {/* CTAs — delay 0.3s */}
      <div
        className="hero-animate flex flex-col sm:flex-row items-center gap-4 mb-16 w-full max-w-sm sm:max-w-none"
        style={{ animationDelay: "0.3s" }}
      >
        <Button
          size="lg"
          onClick={onGetStarted}
          className="btn-iridescent glow-iridescent px-8 text-base font-bold w-full sm:w-auto"
        >
          Empezar gratis
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={onLogin}
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 w-full sm:w-auto"
        >
          Ya tengo cuenta
        </Button>
      </div>

      {/* Stats mini-cards — delay 0.45s */}
      <div
        className="hero-animate grid grid-cols-3 gap-3 max-w-sm w-full"
        style={{ animationDelay: "0.45s" }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-iridescent">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Scroll indicator — delay 0.6s */}
      <div
        className="hero-animate absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1"
        style={{ animationDelay: "0.6s" }}
        aria-hidden="true"
      >
        <span className="text-xs text-muted-foreground/40 uppercase tracking-widest text-[10px]">scroll</span>
        <div className="w-[1px] h-10 bg-gradient-to-b from-muted-foreground/30 to-transparent" />
      </div>
    </section>
  );
}
