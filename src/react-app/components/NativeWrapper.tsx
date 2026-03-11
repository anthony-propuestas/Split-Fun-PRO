import { useEffect, ReactNode } from 'react';
import { useNativeBridge, hideSplashScreen } from '@/react-app/hooks/useNativeBridge';

interface NativeWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that initializes native bridge functionality
 * Must be used inside Router context
 */
export default function NativeWrapper({ children }: NativeWrapperProps) {
  useNativeBridge();

  useEffect(() => {
    // Hide splash screen after a short delay to ensure content is rendered
    const timer = setTimeout(() => {
      hideSplashScreen();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
