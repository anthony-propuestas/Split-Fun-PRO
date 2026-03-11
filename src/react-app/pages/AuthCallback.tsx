import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        navigate("/dashboard");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Error al iniciar sesión. Por favor, intenta de nuevo.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}
