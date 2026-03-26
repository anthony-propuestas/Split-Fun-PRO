import { Users, Receipt, BarChart3, Bell } from "lucide-react";
import { useReveal } from "./useReveal";

const steps = [
  {
    number: "01",
    icon: Users,
    color: "text-iridescent-green",
    bg: "bg-iridescent-green/10",
    emoji: "👥",
    title: "Crea un grupo",
    description:
      "Hogar, viaje de verano, cena de cumple... el nombre ya es lo más difícil.",
  },
  {
    number: "02",
    icon: Receipt,
    color: "text-iridescent-blue",
    bg: "bg-iridescent-blue/10",
    emoji: "🧾",
    title: "Agrega los gastos",
    description:
      "¿Quién pagó el Uber? ¿La pizza? ¿El Airbnb? No importa, ponlo todo ahí.",
  },
  {
    number: "03",
    icon: BarChart3,
    color: "text-iridescent-pink",
    bg: "bg-iridescent-pink/10",
    emoji: "📊",
    title: "Ve los balances",
    description:
      "Quién debe a quién, cuánto y desde cuándo. Sin calculadora. Sin drama.",
  },
  {
    number: "04",
    icon: Bell,
    color: "text-gold",
    bg: "bg-gold/10",
    emoji: "💸",
    title: "Salda (o persigue)",
    description:
      "Paga lo que debes. O activa al Don Barriga si alguien se hace el loco.",
  },
];

export default function HowItWorksSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="relative z-10 py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div data-reveal className="text-center mb-16">
          <p className="text-sm font-semibold text-iridescent-blue uppercase tracking-widest mb-3">
            Cómo funciona
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
            Tan fácil que da rabia
            <br />
            no haberlo usado antes.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              data-reveal
              className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors duration-300"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              {/* Ghost step number */}
              <div
                className="text-7xl font-black text-white/[0.04] absolute -top-2 -right-1 leading-none select-none pointer-events-none"
                aria-hidden="true"
              >
                {step.number}
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl ${step.bg} flex items-center justify-center mb-4`}
              >
                <step.icon className={`w-6 h-6 ${step.color}`} />
              </div>

              {/* Emoji */}
              <div className="text-3xl mb-3" aria-hidden="true">
                {step.emoji}
              </div>

              {/* Content */}
              <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Connector (desktop only, not last item) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-white/10"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
