import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Button } from "@/react-app/components/ui/button";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState<string>("Verificando tu correo...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("El enlace de verificación no es válido.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setStatus("error");
          setMessage(
            body?.message ||
              "El enlace de verificación no es válido o ha expirado. Solicita uno nuevo."
          );
          return;
        }
        setStatus("success");
        setMessage("¡Correo verificado! Ya puedes iniciar sesión.");
        setTimeout(() => navigate("/login"), 2000);
      } catch (e) {
        console.error("[VerifyEmail] error", e);
        setStatus("error");
        setMessage("No se pudo verificar el correo. Inténtalo de nuevo más tarde.");
      }
    };

    void verify();
  }, [token, navigate]);

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="min-h-screen bg-onyx flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Verificación de correo</h1>
        <p
          className={`text-sm ${
            isError ? "text-red-400" : isSuccess ? "text-iridescent-green" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
        <div className="pt-2 space-y-2">
          <Button
            className="w-full btn-iridescent"
            onClick={() => navigate(isSuccess ? "/login" : "/")}
          >
            {isSuccess ? "Ir a iniciar sesión" : "Volver al inicio"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Si el enlace ha expirado, puedes solicitar uno nuevo desde la pantalla de login.
          </p>
        </div>
        <Link to="/" className="text-xs text-iridescent-blue hover:underline block">
          Volver a Split Fun
        </Link>
      </div>
    </div>
  );
}

