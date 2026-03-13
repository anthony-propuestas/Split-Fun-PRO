import { useEffect, useRef, useState } from "react";

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

const GSI_INITIALIZED_KEY = "gsi_initialized_client_id";

// Ref compartido: el callback que recibe la credential (actualizado por la página montada)
const credentialHandlerRef: { current: ((credential: string) => void) | null } = { current: null };

export interface GsiInitializerProps {
  onSuccess: (credential: string) => void;
}

/** Inicializa GSI una sola vez con el callback dado. No muestra prompt automático (evita cool down y FedCM). */
export function GsiInitializer({ onSuccess }: GsiInitializerProps) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    credentialHandlerRef.current = (credential: string) => {
      onSuccessRef.current(credential);
    };
    return () => {
      credentialHandlerRef.current = null;
    };
  }, [onSuccess]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID not configured");
      return;
    }

    const initOnce = () => {
      if (!window.google?.accounts?.id) return;

      const alreadyInitialized =
        (window as unknown as { [GSI_INITIALIZED_KEY]?: string })[GSI_INITIALIZED_KEY] === clientId;
      if (!alreadyInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            credentialHandlerRef.current?.(response.credential);
          },
          use_fedcm_for_prompt: false,
        });
        (window as unknown as { [GSI_INITIALIZED_KEY]: string })[GSI_INITIALIZED_KEY] = clientId;
      }
    };

    if (window.google?.accounts?.id) {
      initOnce();
      return;
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        initOnce();
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return null;
}

export interface GoogleSignInButtonProps {
  id: string;
  className?: string;
}

/** Botón oficial de Google (renderButton). Requiere que GsiInitializer esté montado antes. */
export function GoogleSignInButton({ id, className }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(!!window.google?.accounts?.id);

  useEffect(() => {
    if (!window.google?.accounts?.id) {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setReady(true);
        }
      }, 100);
      return () => clearInterval(interval);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google?.accounts?.id) return;

    const container = containerRef.current;
    // Limpiar contenido previo por si el componente se re-monta
    container.innerHTML = "";

    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 280,
    });
  }, [ready, id]);

  return <div ref={containerRef} id={id} className={className} />;
}
