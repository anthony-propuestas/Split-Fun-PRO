import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg transition-all duration-300 ${
        isOnline
          ? "bg-iridescent-green/20 text-iridescent-green border border-iridescent-green/30"
          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          Conexión restaurada
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Sin conexión - Modo offline
        </>
      )}
    </div>
  );
}
