# Guía para crear APK con Android Studio

Esta app está preparada para convertirse en una APK nativa usando **Capacitor**.

## Requisitos previos

1. **Node.js** (versión 18+)
2. **Android Studio** (última versión)
3. **Java JDK 17**

## Pasos para crear la APK

### 1. Descargar el código fuente

Desde Mocha, descarga el código de la app (menú → "Download Source").

### 2. Instalar dependencias

```bash
cd splitfun
npm install
```

### 3. Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Split Fun" "com.splitfun.app"
```

### 4. Crear el archivo capacitor.config.ts

Crea un archivo `capacitor.config.ts` en la raíz del proyecto:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.splitfun.app',
  appName: 'Split Fun',
  webDir: 'dist',
  server: {
    // Para desarrollo, apunta a tu servidor de Mocha
    url: 'https://splitfun.mocha.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0D0D0D',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D0D0D'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
```

### 5. Construir la app y agregar Android

```bash
# Construir para producción (opcional si usas el server URL)
npm run build

# Agregar plataforma Android
npx cap add android

# Sincronizar los archivos
npx cap sync android
```

### 6. Abrir en Android Studio

```bash
npx cap open android
```

### 7. Configurar el ícono de la app

En Android Studio:
1. Click derecho en `app/res` → New → Image Asset
2. Selecciona tu ícono (usa el logo de Split Fun)
3. Genera todos los tamaños automáticamente

### 8. Generar la APK

En Android Studio:
1. Build → Generate Signed Bundle / APK
2. Selecciona APK
3. Crea o usa un keystore existente
4. Selecciona "release"
5. Click en "Create"

La APK estará en: `android/app/release/app-release.apk`

## Modo de desarrollo vs producción

### Desarrollo (conectado a Mocha)
En `capacitor.config.ts`, usa:
```typescript
server: {
  url: 'https://splitfun.mocha.app',
}
```
Esto carga la app directamente desde Mocha.

### Producción (app standalone)
Comenta o elimina la opción `server.url` y construye localmente:
```bash
npm run build
npx cap sync android
```

## Funcionalidades nativas incluidas

✅ **Botón atrás de Android** - Navega correctamente, doble tap para salir  
✅ **Splash screen** - Pantalla de carga con logo  
✅ **Safe areas** - Compatible con notch y barra de navegación  
✅ **Haptic feedback** - Vibración táctil en interacciones  
✅ **Status bar oscuro** - Integrado con el tema  
✅ **Modo offline** - PWA con caché  

## Solución de problemas

### Error: "Cleartext HTTP traffic not permitted"
Asegúrate de tener `cleartext: true` en la config si usas URLs HTTP.

### La app no carga
Verifica que la URL en `capacitor.config.ts` sea correcta y accesible.

### Problemas con Google OAuth
El OAuth de Google funciona dentro del WebView de Capacitor, pero puede necesitar configuración adicional en Google Cloud Console para agregar el SHA-1 de tu keystore.

## Recursos

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Google OAuth en Capacitor](https://capacitorjs.com/docs/guides/deep-links)
