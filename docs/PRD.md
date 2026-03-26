# PRD — Split Fun PRO

## Documento de Requisitos del Producto (Product Requirements Document)

**Versión:** 1.0
**Fecha:** 2026-03-26
**Estado:** Borrador para revisión

---

## 1. Resumen Ejecutivo

**Split Fun PRO** es una aplicación web y móvil para gestionar gastos compartidos entre grupos de personas. Permite registrar gastos, dividir costos de forma equitativa o porcentual, calcular quién debe qué a quién, registrar liquidaciones, y motivar los pagos a través de un sistema gamificado de recordatorios y logros.

La aplicación corre 100% en la infraestructura de Cloudflare (Pages + Workers + D1 + R2), sin servidor tradicional.

---

## 2. Problema que Resuelve

Cuando un grupo de personas (amigos, familia, compañeros de trabajo o de viaje) comparte gastos, surge el problema de:
- No saber con exactitud quién debe cuánto a quién.
- Perder el rastro de quién pagó qué.
- La incomodidad de pedir dinero prestado de vuelta.
- La complejidad de liquidar múltiples deudas cruzadas entre muchas personas.

**Split Fun PRO** simplifica este proceso con cálculos automáticos, liquidaciones simplificadas y un toque de humor para hacer más fácil pedir que te paguen.

---

## 3. Usuarios Objetivo

### 3.1 Personas

| Persona | Descripción |
|---------|-------------|
| **El organizador** | Alguien que suele pagar adelantado y quiere llevar control de los gastos del grupo (viajes, salidas, apartamento compartido). |
| **El participante** | Miembro del grupo que quiere saber cuánto debe sin hacer cálculos manuales. |
| **El colector** | Quien necesita cobrar a sus amigos y quiere hacerlo de forma divertida sin crear tensión. |

### 3.2 Segmento de Mercado
- Grupos de 2–15 personas
- Casos de uso: viajes, cenas, apartamentos compartidos, eventos
- Habla hispana (UI en español)
- Dispositivos: web (desktop/mobile) y apps nativas Android/iOS

---

## 4. Objetivos del Producto

| Objetivo | Métrica de Éxito |
|----------|-----------------|
| Simplificar el registro de gastos compartidos | < 2 min para registrar un gasto nuevo |
| Eliminar la ambigüedad de deudas | Balance calculado automáticamente en cada grupo |
| Reducir fricción al cobrar | Uso de recordatorios de pago (Don Barriga) |
| Retener usuarios activos | Sistema de logros que premia actividad |
| Soportar usuarios no registrados | Miembros sin cuenta pueden participar en grupos |

---

## 5. Funcionalidades Actuales (MVP)

### 5.1 Autenticación y Cuentas

| Función | Descripción |
|---------|-------------|
| Registro | Email + contraseña con verificación por correo |
| Login | Sesión con cookie HTTP-only, 60 días de duración |
| Verificación de email | Token de 24h enviado por correo (Resend API) |
| Recuperación de contraseña | Token de 1h, invalida sesiones activas |
| Perfil | Nombre de pantalla editable, código de amigo de 6 caracteres |
| Seguridad | Email cifrado en BD (AES-GCM), contraseña PBKDF2, protección ante timing attacks |

### 5.2 Grupos

| Función | Descripción |
|---------|-------------|
| Crear grupo | Nombre, emoji y descripción opcional |
| Invitar miembros | Por código de amigo o por email (sin cuenta) |
| Ver grupo | Lista de miembros, gastos, saldos y liquidaciones |
| Editar grupo | Nombre, emoji y descripción |
| Eliminar grupo | Cascada: elimina miembros, gastos, splits, liquidaciones |

### 5.3 Gastos

| Función | Descripción |
|---------|-------------|
| Crear gasto | Descripción, monto, quién pagó, fecha |
| División equitativa | División automática en partes iguales |
| División porcentual | Cada miembro puede tener un % distinto |
| Historial | Lista de gastos por grupo o todos los grupos |
| Eliminar gasto | Cascade sobre splits |

### 5.4 Saldos y Liquidaciones

| Función | Descripción |
|---------|-------------|
| Cálculo de saldos | Quién debe cuánto a quién dentro del grupo |
| Simplificación de deudas | Netting de deudas cruzadas (si A→B 50 y B→A 30, resultado: A→B 20) |
| Registrar pago | Liquidación entre dos miembros con nota opcional |
| Historial de pagos | Lista de liquidaciones por grupo |
| Deudas pendientes | Vista consolidada de todas las deudas del usuario |

### 5.5 Recordatorios de Pago — "Don Barriga"

| Función | Descripción |
|---------|-------------|
| Enviar recordatorio | Mensaje + meme almacenado en R2 |
| Recibir recordatorios | Vista de recordatorios pendientes para el usuario |
| Contador de no vistos | Badge con cantidad de recordatorios nuevos |
| Marcar como visto | Actualizar estado a "seen" |

### 5.6 Sistema de Logros (Gamificación)

| Logro | Condición de desbloqueo |
|-------|------------------------|
| `first_group` | Crear el primer grupo |
| `group_organizer` | Crear 2 o más grupos |
| `settlements` | Registrar la primera liquidación |

### 5.7 Búsqueda de Usuarios

- Buscar otro usuario por **código de amigo** (6 caracteres alfanuméricos)
- Mínimo 3 caracteres de búsqueda
- Resultado: nombre de pantalla + ID para invitar al grupo

---

## 6. Arquitectura Técnica

### 6.1 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, React Router 7, Vite 7, TypeScript, Tailwind CSS, Radix UI |
| Backend | Cloudflare Workers, Hono 4 |
| Base de datos | Cloudflare D1 (SQLite gestionado) |
| Almacenamiento | Cloudflare R2 (imágenes de memes) |
| Email | Resend API |
| Mobile | Capacitor (Android/iOS) |
| Validación | Zod (compartida entre frontend y worker) |

### 6.2 Infraestructura Cloudflare

```
React SPA (Pages) ←→ Worker API ←→ D1 (SQLite)
                                 ←→ R2 (Storage)
                                 ←→ Resend (Email)
```

### 6.3 Base de Datos (12 tablas)

| Tabla | Propósito |
|-------|-----------|
| `users` | Credenciales con email cifrado |
| `sessions` | Sesiones autenticadas |
| `email_verification_tokens` | Tokens de verificación de correo |
| `password_reset_tokens` | Tokens de recuperación de contraseña |
| `user_profiles` | Nombre de pantalla y código de amigo |
| `groups` | Grupos de gasto compartido |
| `group_members` | Miembros (registrados o no) |
| `expenses` | Gastos con descripción y monto |
| `expense_splits` | División de cada gasto por miembro |
| `settlements` | Pagos/liquidaciones registradas |
| `payment_reminders` | Recordatorios de pago gamificados |
| `user_achievements` | Logros desbloqueados por usuario |

---

## 7. Endpoints de la API (40+)

| Grupo | Endpoints clave |
|-------|----------------|
| Auth | `POST /api/auth/register`, `/login`, `/logout`, `/verify-email`, `/forgot-password`, `/reset-password` |
| Usuario | `GET /api/users/me`, `GET /api/users/search`, `GET/PATCH /api/profile` |
| Dashboard | `GET /api/dashboard`, `GET /api/my-debts` |
| Grupos | `GET/POST /api/groups`, `GET/PATCH/DELETE /api/groups/:id`, `GET /api/groups/:id/balances` |
| Miembros | `POST /api/groups/:id/members`, `DELETE /api/groups/:id/members/:memberId` |
| Gastos | `GET/POST /api/expenses`, `GET /api/groups/:id/expenses`, `DELETE /api/expenses/:id` |
| Liquidaciones | `GET /api/groups/:id/settlements`, `POST /api/settlements` |
| Recordatorios | `POST/GET /api/payment-reminders`, `GET /api/payment-reminders/count`, `PATCH /api/payment-reminders/:id/seen` |
| Logros | `GET /api/achievements`, `POST /api/achievements/check` |

---

## 8. Páginas del Frontend (15)

| Página | Ruta | Acceso |
|--------|------|--------|
| Home / Landing | `/` | Público |
| Registro | `/register` | Público |
| Login | `/login` | Público |
| Olvidé contraseña | `/forgot-password` | Público |
| Resetear contraseña | `/reset-password` | Público |
| Verificar email | `/verify-email` | Público |
| Dashboard | `/dashboard` | Autenticado |
| Grupos | `/groups` | Autenticado |
| Nuevo grupo | `/groups/new` | Autenticado |
| Detalle de grupo | `/groups/:id` | Autenticado |
| Gastos | `/expenses` | Autenticado |
| Nuevo gasto | `/expenses/new` | Autenticado |
| Perfil | `/profile` | Autenticado |
| Don Barriga | `/don-barriga` | Autenticado |
| Logros | `/logros` | Autenticado |

---

## 9. Variables de Entorno

### Worker (secretos en Cloudflare):

| Variable | Descripción |
|----------|-------------|
| `EMAIL_ENCRYPTION_KEY` | Clave AES-256 en Base64 para cifrar emails |
| `RESEND_API_KEY` | API key de Resend para emails transaccionales |
| `FROM_EMAIL` | Dirección de envío verificada en Resend |
| `APP_BASE_URL` | URL base de la app (default: split-fun-pro.pages.dev) |

### Frontend (.env):

| Variable | Descripción |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth (OAuth deshabilitado actualmente) |

---

## 10. Funcionalidades Fuera de Alcance (Futuras)

| Función | Estado |
|---------|--------|
| Google OAuth | Infraestructura lista, endpoint retorna 501 — pendiente habilitación |
| App iOS nativa | Capacitor configurado, pendiente build/publicación |
| Notificaciones push | No implementado |
| Exportar a PDF/Excel | No implementado |
| Multi-moneda | No implementado (sólo monto numérico, sin símbolo de moneda) |
| Roles de admin en grupo | No implementado (el creador no tiene permisos especiales) |

---

## 11. Consideraciones de Seguridad

- Emails nunca se almacenan en texto plano (cifrado AES-GCM + IV por usuario)
- Contraseñas con PBKDF2, 100k iteraciones
- No se revela si un email existe en el sistema (protección de enumeración)
- Comparación de contraseñas resistente a timing attacks
- Cookies: HTTP-only, Secure, SameSite=Strict
- Tokens de un solo uso (verificación y reseteo de contraseña)
- Sesiones revocadas al cambiar contraseña

---

## 12. Criterios de Aceptación

- [ ] Un usuario puede registrarse, verificar su email e iniciar sesión
- [ ] Un usuario puede crear un grupo, agregar miembros (registrados y no registrados)
- [ ] Un usuario puede registrar un gasto y ver los saldos resultantes
- [ ] Los saldos muestran deudas simplificadas (sin duplicados cruzados)
- [ ] Un usuario puede registrar un pago/liquidación
- [ ] Los recordatorios "Don Barriga" son enviables y visibles
- [ ] El sistema de logros desbloquea correctamente en cada acción
- [ ] La sesión persiste 60 días sin necesidad de re-login
- [ ] La recuperación de contraseña funciona e invalida sesiones anteriores

---

*Generado automáticamente por análisis del codebase — Split Fun PRO — 2026-03-26*
