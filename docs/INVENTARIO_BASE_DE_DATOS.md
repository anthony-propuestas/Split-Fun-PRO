# Inventario de bases de datos – Split Fun PRO

## Estado actual

- **No hay archivos SQLite** (`.db`, `.sqlite`, `.sqlite3`) en el repositorio. La aplicación está diseñada para **Cloudflare D1** como única base de datos.
- **Un único Worker** (`src/worker/index.ts`) utiliza la base de datos mediante el binding **`DB`** (D1).

## Binding y configuración

| Recurso                 | Binding / Variable        | Uso |
|------------------------|---------------------------|-----|
| D1                     | `env.DB`                  | Todas las operaciones SQL (auth, perfiles, grupos, gastos, splits, settlements, logros, recordatorios). |
| R2                     | `env.R2_BUCKET`           | Almacenamiento de objetos. |
| Secret                 | `env.EMAIL_ENCRYPTION_KEY`| Clave AES-GCM base64 para cifrar emails almacenados en D1. |
| Secret                 | `env.RESEND_API_KEY`      | API key de Resend para envío de correos transaccionales. |
| Secret (opcional)      | `env.FROM_EMAIL`          | Dirección remitente verificada (ej: `Split Fun PRO <no-reply@splitfun.org>`). |
| Variable (opcional)    | `env.APP_BASE_URL`        | URL base para links en emails (default: `https://split-fun-pro.pages.dev`). |

Configuración en [wrangler.json](wrangler.json): `d1_databases[].binding = "DB"`.
Secrets configurados con: `npx wrangler pages secret put <NOMBRE>`.

## Tablas (esquema en `migrations/`)

| Migración | Tabla                       | Uso principal |
|-----------|-----------------------------|----------------|
| 1.sql     | `groups`                    | Grupos de gastos compartidos (nombre, emoji, descripción, creador). |
| 2.sql     | `group_members`             | Miembros por grupo (user_id, name, email, is_registered). |
| 3.sql     | `expenses`                  | Gastos por grupo (amount, paid_by_member_id, split_type, expense_date). |
| 4.sql     | `expense_splits`            | Reparto de cada gasto por miembro (amount, percentage). |
| 5.sql     | `user_profiles`             | Perfil de usuario (user_id, friend_code, display_name). |
| 6.sql     | `settlements`               | Pagos entre miembros (from_member_id, to_member_id, amount). |
| 7.sql     | `payment_reminders`         | Recordatorios de pago (from/to user/member, amount, meme_url, is_seen). |
| 8.sql     | `user_achievements`         | Logros desbloqueados por usuario (achievement_key, unlocked_at). |
| 9.sql     | `users`                     | Credenciales de acceso (email cifrado AES-GCM, email_hash SHA-256, password_hash PBKDF2, email_verified_at). |
| 9.sql     | `sessions`                  | Sesiones activas por usuario (token opaco, expires_at 60 días, last_activity_at). |
| 9.sql     | `email_verification_tokens` | Tokens de verificación de correo (UUID, expiran en 24h, used_at para invalidación). |
| 9.sql     | `password_reset_tokens`     | Tokens de recuperación de contraseña (UUID, expiran en 1h, used_at para invalidación). |

## Operaciones típicas por tabla

- **users**: Inserción en registro; lectura por `email_hash` en login y registro (zero-trust); actualización de `email_verified_at` al verificar correo.
- **sessions**: Inserción al login; lectura por token en auth middleware; actualización de `last_activity_at`; borrado en logout y expiración.
- **email_verification_tokens / password_reset_tokens**: Inserción al generar; lectura por token para validar; actualización de `used_at` al consumir.
- **user_profiles**: Lectura por `user_id` (auth middleware, sesiones); escritura en registro y actualización de perfil/código de amigo.
- **groups**: CRUD por `created_by`; listado de grupos del usuario.
- **group_members**: Altas al crear/unirse a grupo; lecturas para detalle de grupo y balances.
- **expenses / expense_splits**: Inserción al crear gasto; lecturas para listados y cálculos de balance; borrado en cascada al eliminar gasto o grupo.
- **settlements**: Inserción al registrar pago; lecturas para historial y balances.
- **payment_reminders**: CRUD; marcar como vistos; envío a usuarios destino.
- **user_achievements**: Inserción al desbloquear; lecturas para perfil y pantalla de logros.

## Características SQLite utilizadas

- Tipos: `INTEGER`, `TEXT`, `REAL`, `BOOLEAN` (como 0/1), `DATE`, `TIMESTAMP`.
- `PRIMARY KEY AUTOINCREMENT`, `UNIQUE`, `DEFAULT`, `NOT NULL`.
- Índices en claves foráneas y columnas de búsqueda (user_id, group_id, friend_code, etc.).
- Sin triggers, vistas ni extensiones (FTS, etc.); compatible con D1.

## Conclusión

La aplicación ya está orientada a **Cloudflare D1**. No existe migración desde SQLite en disco en este repo; los pasos siguientes del plan se centran en consolidar esquema, bindings, tooling de migraciones, capa de acceso a datos, pruebas, cutover y monitorización sobre D1.
