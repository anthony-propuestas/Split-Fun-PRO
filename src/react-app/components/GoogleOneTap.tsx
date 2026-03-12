import { useEffect } from "react";

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

export function GoogleOneTap({ onSuccess, onError }: GoogleOneTapProps) {
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID not configured");
      return;
    }

    let script: HTMLScriptElement | null = null;

    const initOneTap = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          onSuccess(response.credential);
        },
        auto_select: true,
        cancel_on_tap_outside: false,
      });

      window.google?.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          onError?.();
        }
      });
    };

    // If Google script is already loaded, just initialize
    if (window.google) {
      initOneTap();
      return;
    }

    // Load Google Identity Services script
    script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initOneTap;
    document.head.appendChild(script);

    return () => {
      // Cleanup: disable auto-select when component unmounts
      window.google?.accounts.id.disableAutoSelect();
    };
  }, [onSuccess, onError]);

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
