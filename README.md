# Split Fun PRO

Aplicación web desarrollada con React, Vite, Tailwind CSS y Cloudflare Pages.

## Desarrollo Local

Para iniciar el servidor de desarrollo:

```bash
npm install
npm run dev
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Vite.
- `npm run build`: Compila la aplicación y genera el directorio `dist`.
- `npm run lint`: Ejecuta ESLint para analizar el código.
- `npm run check`: Verifica los tipos, compila la aplicación y realiza un simulacro de despliegue.
- `npm run deploy`: Compila y despliega en Cloudflare Pages.

## Despliegue en Cloudflare Pages

Si el build falla con *"Error al instalar herramientas o dependencias"*:

1. **Versión de Node**: En el proyecto hay un `.nvmrc` con Node 20. En Cloudflare (Settings -> Environment variables) añade `NODE_VERSION` = `20` para el entorno de build.

2. **Resolución de dependencias**: Usa instalación con resolución flexible si hay conflictos (ej. `@vitejs/plugin-react`):
   - Añade la variable de entorno: `SKIP_DEPENDENCY_INSTALL` = `true`
   - En **Build command** pon: `npm install --legacy-peer-deps && npm run build` (o usa `--force`).
   - **Build output directory**: `dist`

3. Asegúrate de que tu rama principal tiene el archivo `package-lock.json` actualizado.
