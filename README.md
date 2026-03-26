# Split Fun PRO

Aplicación web para gestión de gastos compartidos. Stack: React, Vite, Tailwind CSS, Cloudflare Pages + D1 + R2.

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

## Variables de entorno y Secrets

Configurar en Cloudflare Pages con `npx wrangler pages secret put <NOMBRE>`:

| Variable | Tipo | Descripción |
|---|---|---|
| `EMAIL_ENCRYPTION_KEY` | Secret | Clave AES-GCM base64 para cifrar emails en D1 |
| `RESEND_API_KEY` | Secret | API key de Resend para envío de correos transaccionales |
| `FROM_EMAIL` | Secret (opcional) | Remitente verificado, ej: `Split Fun PRO <no-reply@splitfun.org>` |
| `APP_BASE_URL` | Opcional | URL base para links en emails (default: `https://split-fun-pro.pages.dev`) |

## Sistema de autenticación

Flujo completo implementado con email/contraseña:

1. **Registro** → se crea el usuario con email cifrado (AES-GCM) y contraseña hasheada (PBKDF2, 100k iteraciones)
2. **Verificación de email** → se envía un email con link de 24h vía Resend (dominio: `splitfun.org`)
3. **Login** → solo disponible tras verificar el email; genera sesión de 60 días
4. **Recuperación de contraseña** → email con token de 1h para resetear

Endpoints en `src/worker/index.ts`:
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Despliegue en Cloudflare Pages

Si el build falla con *"Error al instalar herramientas o dependencias"*:

1. **Versión de Node**: En el proyecto hay un `.nvmrc` con Node 20. En Cloudflare (Settings -> Environment variables) añade `NODE_VERSION` = `20` para el entorno de build.

2. **Resolución de dependencias**: Usa instalación con resolución flexible si hay conflictos (ej. `@vitejs/plugin-react`):
   - Añade la variable de entorno: `SKIP_DEPENDENCY_INSTALL` = `true`
   - En **Build command** pon: `npm install --legacy-peer-deps && npm run build` (o usa `--force`).
   - **Build output directory**: `dist`

3. Asegúrate de que tu rama principal tiene el archivo `package-lock.json` actualizado.
