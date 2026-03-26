import { useState, useEffect } from "react";
import { Bell, X, DollarSign, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/react-app/components/ui/dialog";
import AppLayout from "@/react-app/components/layout/AppLayout";

interface PaymentReminder {
  id: number;
  group_id: number;
  group_name: string;
  group_emoji: string;
  from_member_name: string;
  to_member_name: string;
  amount: number;
  meme_url: string;
  message: string;
  is_seen: number;
  created_at: string;
}

export default function DonBarriga() {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);
  const [memeDialogOpen, setMemeDialogOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);


  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/payment-reminders");
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const openMeme = async (reminder: PaymentReminder) => {
    setImageLoaded(false);
    setImageError(false);
    setSelectedReminder(reminder);
    setMemeDialogOpen(true);

    // Mark as seen
    if (!reminder.is_seen) {
      try {
        await fetch(`/api/payment-reminders/${reminder.id}/seen`, {
          method: "PATCH",
        });
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminder.id ? { ...r, is_seen: 1 } : r
          )
        );
      } catch (error) {
        console.error("Error marking reminder as seen:", error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const unseenCount = reminders.filter((r) => !r.is_seen).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-iridescent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-red-500/30 flex items-center justify-center text-3xl border border-amber-500/30">
            🏠
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Don Barriga</h1>
            <p className="text-muted-foreground">
              {unseenCount > 0
                ? `${unseenCount} recordatorio${unseenCount > 1 ? "s" : ""} sin ver`
                : "No hay recordatorios pendientes"}
            </p>
          </div>
        </div>

        {/* Reminders list */}
        {reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <button
                key={reminder.id}
                onClick={() => openMeme(reminder)}
                className={`w-full text-left glass-card rounded-xl p-4 border transition-all hover:scale-[1.01] ${
                  reminder.is_seen
                    ? "border-white/10 opacity-70"
                    : "border-amber-500/50 ring-2 ring-amber-500/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Bell className={`w-6 h-6 ${reminder.is_seen ? "text-muted-foreground" : "text-amber-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{reminder.group_emoji}</span>
                      <span className="font-medium text-foreground truncate">
                        {reminder.group_name}
                      </span>
                      {!reminder.is_seen && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-amber-400">{reminder.from_member_name}</span>
                      {" te recuerda que le debes "}
                      <span className="font-bold text-red-400">${reminder.amount.toFixed(2)}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(reminder.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Toca para ver</p>
                    <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
                      {reminder.meme_url ? (
                        <img
                          src={reminder.meme_url}
                          alt=""
                          className="w-full h-full object-cover opacity-60"
                        />
                      ) : (
                        <span className="text-xl">🏠</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-iridescent-green/20 via-iridescent-blue/20 to-iridescent-pink/20 flex items-center justify-center">
              <span className="text-4xl">😌</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              ¡Sin cobranzas!
            </h3>
            <p className="text-muted-foreground">
              No tienes recordatorios de pago pendientes. Don Barriga no ha venido a cobrarte.
            </p>
          </div>
        )}

        {/* Meme fullscreen dialog */}
        <Dialog open={memeDialogOpen} onOpenChange={setMemeDialogOpen}>
          <DialogContent 
            className="sm:max-w-2xl p-0 bg-black border-none overflow-hidden"
            showCloseButton={false}
          >
            {selectedReminder && (
              <div className="relative">
                {/* Close button */}
                <button
                  onClick={() => setMemeDialogOpen(false)}
                  className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Meme image or placeholder */}
                {selectedReminder.meme_url ? (
                  <>
                    {!imageLoaded && !imageError && (
                      <div className="flex items-center justify-center h-64 bg-neutral-900">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {imageError && (
                      <div className="flex flex-col items-center justify-center h-48 bg-neutral-900 text-white">
                        <span className="text-5xl mb-2">🏠</span>
                        <p className="text-sm text-white/50">No se pudo cargar la imagen</p>
                      </div>
                    )}
                    <img
                      src={selectedReminder.meme_url}
                      alt="Don Barriga meme"
                      className={`w-full h-auto ${imageLoaded ? "block" : "hidden"}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-neutral-900">
                    <span className="text-7xl">🏠</span>
                  </div>
                )}

                {/* Message overlay */}
                <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-6">
                  <p className="text-white text-xl font-bold text-center mb-3">
                    {selectedReminder.message}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-2xl font-bold">
                      ${selectedReminder.amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-center text-white/70 text-sm mt-2">
                    {selectedReminder.from_member_name} en {selectedReminder.group_name}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
