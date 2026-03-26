import { Trophy, Bell, Zap, Users } from "lucide-react";
import { useReveal } from "./useReveal";

const features = [
  {
    icon: Bell,
    emoji: "🎭",
    gradientFrom: "from-amber-500/15",
    gradientTo: "to-orange-500/15",
    iconColor: "text-amber-400",
    tag: "Favorito de los usuarios 🔥",
    title: "Don Barriga Mode",
    headline: "Cobra con memes épicos.",
    description:
      "Porque a veces pedir el dinero con un mensaje normal no funciona. Activa el modo Don Barriga y manda un recordatorio que nadie puede ignorar.",
  },
  {
    icon: Trophy,
    emoji: "🏆",
    gradientFrom: "from-yellow-500/15",
    gradientTo: "to-amber-500/15",
    iconColor: "text-gold",
    tag: "Modo RPG activado",
    title: "Sistema de Logros",
    headline: "Divide gastos, colecciona medallas.",
    description:
      "Cada acción suma: pagar a tiempo, crear grupos, invitar amigos... desbloquea logros y conviértete en el MVP de tus amigos.",
  },
  {
    icon: Zap,
    emoji: "⚡",
    gradientFrom: "from-iridescent-green/15",
    gradientTo: "to-cyan-500/15",
    iconColor: "text-iridescent-green",
    tag: "Tiempo real",
    title: "Balances al instante",
    headline: "Sin calculadoras. Sin drama.",
    description:
      "Agrega un gasto y al segundo ya sabes quién debe cuánto a quién. Los números hacen el trabajo, tú solo tienes que cobrar.",
  },
  {
    icon: Users,
    emoji: "👥",
    gradientFrom: "from-iridescent-blue/15",
    gradientTo: "to-neon-purple/15",
    iconColor: "text-iridescent-blue",
    tag: "Sin límites",
    title: "Grupos ilimitados",
    headline: "Un grupo para cada situación.",
    description:
      "El piso, el viaje de verano, la liga de fútbol, la cena de Navidad... crea todos los grupos que quieras, sin límite.",
  },
];

export default function GamificationSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="relative z-10 py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div data-reveal className="text-center mb-16">
          <p className="text-sm font-semibold text-iridescent-pink uppercase tracking-widest mb-3">
            Por qué Split Fun
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight mb-4">
            No es solo una app de gastos.
            <br />
            <span className="text-iridescent">Es un juego.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Gamificamos lo peor de compartir piso o viajar con amigos.
            Ahora cobrar da puntos.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              data-reveal
              className="glass-card rounded-3xl p-8 relative overflow-hidden group"
              style={{ transitionDelay: `${index * 0.08}s` }}
            >
              {/* Hover gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}
                aria-hidden="true"
              />

              <div className="relative z-10">
                {/* Tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs text-muted-foreground mb-5">
                  {feature.tag}
                </div>

                {/* Emoji + icon row */}
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-4xl leading-none" aria-hidden="true">
                    {feature.emoji}
                  </span>
                  <feature.icon className={`w-6 h-6 mt-1 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {feature.title}
                </p>
                <p className="text-xl font-bold text-foreground mb-3">
                  {feature.headline}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
