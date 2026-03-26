
# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Split Fun PRO
- **Date:** 2026-03-26
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

### Requirement: Authentication — Register
- **Description:** Register a new user with email and password. Validates format and minimum length. Sends verification email.

#### Test TC001 — POST /api/auth/register (email/password)
- **Test Code:** [TC001_postapiauthregisteremailpassword.py](./tmp/TC001_postapiauthregisteremailpassword.py)
- **Test Error:** `AssertionError: Expected status code 200, got 404`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/d14ad002-e4fd-42e7-9f05-f566a5e7d380
- **Status:** ❌ Failed
- **Severity:** CRITICAL
- **Analysis / Findings:** El servidor Vite en puerto 5173 respondió 404 a `/api/auth/register`. El plugin `@cloudflare/vite-plugin` integra el Worker de Cloudflare en el servidor de desarrollo de Vite, pero el Worker no está respondiendo las rutas `/api/*`. Causa probable: la variable de entorno `EMAIL_ENCRYPTION_KEY` no está configurada localmente, lo que impide que el Worker arranque correctamente; o el plugin necesita un archivo `.dev.vars` con los secretos para funcionar en local.

---

#### Test TC004 — POST /api/auth/verify-email (token)
- **Test Code:** [TC004_postapiauthverifyemailtoken.py](./tmp/TC004_postapiauthverifyemailtoken.py)
- **Test Error:** `AssertionError: User registration failed: 404 Client Error: Not Found for url: http://localhost:5173/api/auth/register`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/68e516e1-64d7-42ae-a667-db68b68af4b3
- **Status:** ❌ Failed
- **Severity:** CRITICAL
- **Analysis / Findings:** Este test depende de `/api/auth/register` para crear el usuario de prueba. Al fallar el registro (404), el flujo de verificación de email no puede ejecutarse. Bloqueado por el mismo problema de routing del Worker.

---

#### Test TC005 — POST /api/auth/forgot-password (email)
- **Test Code:** [TC005_postapiauthforgotpasswordemail.py](./tmp/TC005_postapiauthforgotpasswordemail.py)
- **Test Error:** `AssertionError: Expected status 200, got 404`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/0701cdd4-eefd-4639-8f64-29d3bf5e9b9f
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Mismo patrón: ruta `/api/auth/forgot-password` retorna 404. El worker no está sirviendo las rutas API en el servidor local.

---

### Requirement: Authentication — Login & Session
- **Description:** Login con email/password, cookie HTTP-only de 60 días, logout e invalidación de sesión.

#### Test TC002 — POST /api/auth/login (email/password)
- **Test Code:** [TC002_postapiauthloginemailpassword.py](./tmp/TC002_postapiauthloginemailpassword.py)
- **Test Error:** `AssertionError: Expected status code 200, got 404`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/b3e8780b-eecf-4515-bfd9-d0fff7598f97
- **Status:** ❌ Failed
- **Severity:** CRITICAL
- **Analysis / Findings:** `/api/auth/login` retorna 404 en lugar del 200 esperado. Mismo problema de raíz: el Cloudflare Worker no está siendo enrutado correctamente por el plugin de Vite en el entorno local de prueba.

---

#### Test TC003 — POST /api/auth/logout
- **Test Code:** [TC003_postapiauthlogout.py](./tmp/TC003_postapiauthlogout.py)
- **Test Error:** `AssertionError` (prerequisito de login falló)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/8687eee0-7dd8-4c60-a26f-d9f8bb009147
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** No se pudo obtener una sesión válida (login retorna 404), por lo que el logout no pudo ser probado.

---

#### Test TC006 — POST /api/auth/reset-password (token/password)
- **Test Code:** [TC006_postapiauthresetpasswordtokenpassword.py](./tmp/TC006_postapiauthresetpasswordtokenpassword.py)
- **Test Error:** `AssertionError` (flujo completo requiere registro y forgot-password funcionando)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/189bf246-53f4-4e9c-8c64-538488efe5b6
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Bloqueado en cascada: depende de registro y forgot-password que también retornan 404.

---

### Requirement: User Profile
- **Description:** Ver y editar perfil (display name, friend code), buscar usuarios por código de amigo.

#### Test TC007 — GET /api/users/me
- **Test Code:** [TC007_getapiusersme.py](./tmp/TC007_getapiusersme.py)
- **Test Error:** `AssertionError: Register failed:`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/4e3de091-30c4-4c21-aef5-94efb8fd0388
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El test crea un usuario primero y luego consulta `/api/users/me`. Falló porque el paso de registro (prerequisito) retornó 404.

---

#### Test TC008 — GET /api/profile
- **Test Code:** [TC008_getapiprofile.py](./tmp/TC008_getapiprofile.py)
- **Test Error:** `AssertionError: Login failed:`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/4c16e120-a8c8-46f1-a004-c1335fdeaf5e
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El login falló (404), impidiendo obtener la cookie de sesión necesaria para acceder a `/api/profile`.

---

#### Test TC009 — PATCH /api/profile (display_name)
- **Test Code:** [TC009_patchapiprofiledisplayname.py](./tmp/TC009_patchapiprofiledisplayname.py)
- **Test Error:** `AssertionError: Register failed:`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/7745c4b9-3dea-4ffa-9a59-2a3fa214290e
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El registro como prerequisito falló (404). La edición del perfil no pudo verificarse.

---

### Requirement: Dashboard
- **Description:** Vista consolidada de grupos, deudas pendientes y actividad reciente del usuario autenticado.

#### Test TC010 — GET /api/dashboard
- **Test Code:** [TC010_getapidashboard.py](./tmp/TC010_getapidashboard.py)
- **Test Error:** `AssertionError: Login failed:`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f63a69cf-c624-4bc7-a326-e9efd1a15421/858c16dd-4d7e-4a41-8318-0d83f3ea301d
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El login es prerequisito para acceder al dashboard. Al retornar 404, no se pudo obtener sesión y el endpoint no fue probado.

---

## 3️⃣ Coverage & Matching Metrics

- **0% de tests pasaron** (0/10)

| Requirement                    | Total Tests | ✅ Passed | ❌ Failed |
|-------------------------------|-------------|-----------|----------|
| Authentication — Register      | 3           | 0         | 3        |
| Authentication — Login/Session | 3           | 0         | 3        |
| User Profile                   | 3           | 0         | 3        |
| Dashboard                      | 1           | 0         | 1        |
| **Total**                      | **10**      | **0**     | **10**   |

---

## 4️⃣ Key Gaps / Risks

> **0% de tests pasaron.** Todos los fallos comparten la misma causa raíz.

### Causa raíz principal: Worker no sirve rutas `/api/*` en local

Todos los tests recibieron **HTTP 404** al llamar a cualquier endpoint bajo `/api/`. Esto indica que el **Cloudflare Worker no está activo** como parte del servidor de desarrollo.

**Diagnóstico probable:**

1. **Falta `.dev.vars`** — El Worker necesita las variables secretas (`EMAIL_ENCRYPTION_KEY`, `RESEND_API_KEY`) para iniciar. Sin ellas, el plugin `@cloudflare/vite-plugin` puede fallar silenciosamente al arrancar el Worker, dejando solo el frontend activo.

2. **El Worker no se inicializa correctamente en Windows** — Existen problemas conocidos con `@cloudflare/vite-plugin` en entornos Windows donde el miniflare (el simulador local del Worker) no arranca, y Vite sirve el frontend pero no las rutas del Worker.

**Acción correctiva recomendada:**

```bash
# 1. Crear archivo .dev.vars en la raíz del proyecto con:
EMAIL_ENCRYPTION_KEY=<tu-clave-aes-256-en-base64>
RESEND_API_KEY=<tu-api-key-de-resend>

# 2. Verificar que el Worker responde localmente:
curl http://localhost:5173/api/auth/register -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"password123"}'

# 3. Si el problema persiste en Windows, probar con WSL2 o ejecutar con wrangler directamente:
npx wrangler dev --local
```

### Riesgos adicionales identificados (no bloqueantes en este ciclo)

| Riesgo | Área | Impacto |
|--------|------|---------|
| Google OAuth retorna 501 | Autenticación | Sin OAuth, solo email/password disponible |
| `EMAIL_ENCRYPTION_KEY` ausente = 500 en producción | Auth | Todos los flujos de auth fallan si el secreto no está configurado en Cloudflare |
| El creador del grupo no tiene permisos especiales | Grupos | Cualquier miembro puede eliminar un grupo |
| No hay validación de monto mínimo en gastos | Gastos | Gastos de $0 o negativos podrían registrarse |
