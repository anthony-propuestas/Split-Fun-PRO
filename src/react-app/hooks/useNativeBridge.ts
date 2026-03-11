import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';

/**
 * Native Bridge Hook for Android/Capacitor compatibility
 * Handles: back button, deep links, status bar, haptic feedback
 */

// Check if running in Capacitor/WebView
export const isNative = () => {
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
};

// Check if running on Android
export const isAndroid = () => {
  return /android/i.test(navigator.userAgent);
};

// Check if running on iOS
export const isIOS = () => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

// Haptic feedback (for devices that support it)
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

// Hide splash screen
export const hideSplashScreen = () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 300);
  }
};

// Main navigation routes (for back button logic)
const MAIN_ROUTES = ['/dashboard', '/groups', '/expenses', '/profile', '/don-barriga', '/logros'];

export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const exitConfirmRef = useRef(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBackButton = useCallback(() => {
    const currentPath = location.pathname;
    
    // If on a main route, confirm exit or go to dashboard
    if (MAIN_ROUTES.includes(currentPath)) {
      if (currentPath === '/dashboard') {
        // Double-tap to exit
        if (exitConfirmRef.current) {
          // Exit app (Capacitor will handle this)
          if (isNative()) {
            (window as unknown as { Capacitor?: { Plugins?: { App?: { exitApp?: () => void } } } })
              .Capacitor?.Plugins?.App?.exitApp?.();
          }
        } else {
          exitConfirmRef.current = true;
          // Show toast (you can integrate with a toast library)
          console.log('Presiona atrás de nuevo para salir');
          
          // Reset after 2 seconds
          exitTimeoutRef.current = setTimeout(() => {
            exitConfirmRef.current = false;
          }, 2000);
        }
      } else {
        // Go to dashboard from other main routes
        navigate('/dashboard');
      }
    } else {
      // For sub-routes, go back in history
      navigate(-1);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Handle physical back button on Android
    const handlePopState = (e: PopStateEvent) => {
      if (isAndroid()) {
        e.preventDefault();
        handleBackButton();
      }
    };

    // For Capacitor
    const handleCapacitorBack = () => {
      handleBackButton();
    };

    window.addEventListener('popstate', handlePopState);
    
    // Listen for Capacitor back button event
    document.addEventListener('backbutton', handleCapacitorBack);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('backbutton', handleCapacitorBack);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [handleBackButton]);
}

// Deep link handler hook
export function useDeepLinks(onDeepLink: (path: string) => void) {
  useEffect(() => {
    const handleDeepLink = (event: CustomEvent<{ url: string }>) => {
      const url = new URL(event.detail.url);
      onDeepLink(url.pathname);
    };

    // Listen for Capacitor deep link events
    document.addEventListener('appUrlOpen', handleDeepLink as EventListener);

    return () => {
      document.removeEventListener('appUrlOpen', handleDeepLink as EventListener);
    };
  }, [onDeepLink]);
}

// Status bar configuration
export function useStatusBar() {
  useEffect(() => {
    if (isNative()) {
      // Set dark status bar
      const Capacitor = (window as unknown as { Capacitor?: { Plugins?: { StatusBar?: { 
        setBackgroundColor?: (opts: { color: string }) => void;
        setStyle?: (opts: { style: string }) => void;
      } } } }).Capacitor;
      
      Capacitor?.Plugins?.StatusBar?.setBackgroundColor?.({ color: '#0D0D0D' });
      Capacitor?.Plugins?.StatusBar?.setStyle?.({ style: 'DARK' });
    }
  }, []);
}

// Combined native bridge hook
export function useNativeBridge() {
  useAndroidBackButton();
  useStatusBar();
  
  useEffect(() => {
    // Hide splash screen when app is ready
    hideSplashScreen();
    
    // Log platform info
    console.log('Platform:', {
      isNative: isNative(),
      isAndroid: isAndroid(),
      isIOS: isIOS()
    });
  }, []);
}
