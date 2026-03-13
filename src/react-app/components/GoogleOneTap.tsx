import { useEffect, useRef } from "react";

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
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

const GSI_INITIALIZED_KEY = "gsi_initialized_client_id";

export function GoogleOneTap({ onSuccess, onError }: GoogleOneTapProps) {
  const callbackRef = useRef({ onSuccess, onError });
  callbackRef.current = { onSuccess, onError };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID not configured");
      return;
    }

    let script: HTMLScriptElement | null = null;

    const initOneTap = () => {
      if (!window.google?.accounts?.id) return;

      const alreadyInitialized = (window as unknown as { [GSI_INITIALIZED_KEY]?: string })[GSI_INITIALIZED_KEY] === clientId;
      if (!alreadyInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            callbackRef.current.onSuccess(response.credential);
          },
          auto_select: true,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
        });
        (window as unknown as { [GSI_INITIALIZED_KEY]: string })[GSI_INITIALIZED_KEY] = clientId;
      }

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          callbackRef.current.onError?.();
        }
      });
    };

    if (window.google?.accounts?.id) {
      initOneTap();
      return () => {
        window.google?.accounts.id.disableAutoSelect();
      };
    }

    script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initOneTap;
    document.head.appendChild(script);

    return () => {
      window.google?.accounts.id.disableAutoSelect();
    };
  }, []);

  // The One Tap prompt is rendered by Google — no DOM element needed
  return null;
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  className?: string;
}

/** Renders Google's branded sign-in button (alternative to One Tap prompt) */
export function GoogleSignInButton({ onSuccess, className }: GoogleSignInButtonProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google) return;

    const container = document.getElementById("google-signin-btn");
    if (!container) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onSuccess(response.credential),
      use_fedcm_for_prompt: true,
    });

    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 280,
    });
  }, [clientId, onSuccess]);

  return <div id="google-signin-btn" className={className} />;
}
