import { useState, useEffect } from "react";
import { Trophy, Lock, CheckCircle, Sparkles } from "lucide-react";

interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

interface AchievementsData {
  achievements: Achievement[];
  total: number;
  unlocked: number;
}

export default function Logros() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      // First check for new achievements
      setChecking(true);
      await fetch("/api/achievements/check", { method: "POST" });
      setChecking(false);

      // Then get all achievements
      const res = await fetch("/api/achievements");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-iridescent-blue border-t-transparent animate-spin" />
            <p className="text-muted-foreground">
              {checking ? "Verificando logros..." : "Cargando..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">Error al cargar los logros</p>
        </div>
      </div>
    );
  }

  const progressPercent = (data.unlocked / data.total) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logros</h1>
          <p className="text-muted-foreground">
            Completa metas y desbloquea recompensas
          </p>
        </div>
      </div>

      {/* Progress card */}
      <div className="glass-card p-6 relative overflow-hidden">
        {/* Sparkle decoration */}
        <div className="absolute top-2 right-2">
          <Sparkles className="w-5 h-5 text-gold/50" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Tu progreso</span>
          <span className="text-lg font-bold text-gold">
            {data.unlocked} / {data.total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {progressPercent === 100 && (
          <p className="text-center text-gold mt-4 text-sm font-medium">
            🎉 ¡Completaste todos los logros!
          </p>
        )}
      </div>

      {/* Achievements list */}
      <div className="space-y-3">
        {data.achievements.map((achievement) => (
          <div
            key={achievement.key}
            className={`glass-card p-4 transition-all duration-300 ${
              achievement.unlocked
                ? "border-gold/30 bg-gradient-to-r from-amber-500/5 to-transparent"
                : "opacity-70 grayscale"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/20"
                    : "bg-white/5"
                }`}
              >
                {achievement.icon}
                {achievement.unlocked && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                {!achievement.unlocked && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold ${
                    achievement.unlocked ? "text-gold" : "text-muted-foreground"
                  }`}
                >
                  {achievement.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {achievement.description}
                </p>
                {achievement.unlocked && achievement.unlocked_at && (
                  <p className="text-xs text-green-400/80 mt-1">
                    Desbloqueado el {formatDate(achievement.unlocked_at)}
                  </p>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                {achievement.unlocked ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational footer */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          {data.unlocked === 0
            ? "¡Comienza a usar la app para desbloquear logros!"
            : data.unlocked < data.total
            ? "¡Sigue así! Aún te quedan logros por desbloquear"
            : "🏆 ¡Eres un maestro de SplitWise!"}
        </p>
      </div>
    </div>
  );
}
