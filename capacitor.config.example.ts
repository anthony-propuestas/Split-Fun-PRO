/**
 * Capacitor Configuration Example
 * 
 * Copia este archivo como capacitor.config.ts y ajusta según tus necesidades.
 * 
 * Para usar: npm install @capacitor/core @capacitor/cli @capacitor/android
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identificador único de la app (formato: com.empresa.app)
  appId: 'com.splitfun.app',
  
  // Nombre que aparece en el dispositivo
  appName: 'Split Fun',
  
  // Directorio donde está el build de la app
  webDir: 'dist',
  
  // Configuración del servidor
  server: {
    // DESARROLLO: Apunta a Mocha para ver cambios en tiempo real
    url: 'https://splitfun.mocha.app',
    
    // PRODUCCIÓN: Comenta 'url' arriba y descomenta esto:
    // androidScheme: 'https',
    
    cleartext: true,
  },
  
  // Plugins nativos
  plugins: {
    // Pantalla de carga
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0D0D0D',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#00D4AA',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    // Barra de estado
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D0D0D',
    },
    
    // Teclado
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
  
  // Configuración específica de Android
  android: {
    // Permitir contenido mixto (HTTP y HTTPS)
    allowMixedContent: true,
    
    // Capturar input del teclado
    captureInput: true,
    
    // Debugging (desactivar en producción)
    webContentsDebuggingEnabled: false,
    
    // Tema de la barra de navegación
    backgroundColor: '#0D0D0D',
    
    // Soporte para deep links
    // Agregar intent-filters en AndroidManifest.xml para deep links
  },
  
  // Configuración específica de iOS (si lo necesitas después)
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
