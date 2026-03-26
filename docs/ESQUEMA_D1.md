# Esquema Cloudflare D1 – Split Fun PRO

## Instancia D1

- **Una sola base D1** por entorno (development, staging, production).
- Nomenclatura recomendada: `split-fun-pro-d1` o el `database_name` definido en Cloudflare (p. ej. por UUID en `wrangler.json`).

## Compatibilidad SQLite → D1

D1 usa el motor SQLite. El esquema actual en `migrations/` es compatible:

- Tipos: `INTEGER`, `TEXT`, `REAL`, `BOOLEAN` (0/1), `DATE`, `TIMESTAMP`.
- Constraints: `PRIMARY KEY`, `AUTOINCREMENT`, `UNIQUE`, `NOT NULL`, `DEFAULT`.
- Sin triggers ni vistas; la lógica se mantiene en el Worker.

## Orden de tablas (dependencias)

1. `users` – independiente (base de autenticación).
2. `user_profiles` – independiente (perfil público, friend_code).
3. `sessions` – depende de `users`.
4. `email_verification_tokens` – depende de `users`.
5. `password_reset_tokens` – depende de `users`.
6. `groups` – depende de `user_profiles.user_id` (created_by).
7. `group_members` – depende de `groups`, opcionalmente `user_profiles`.
8. `expenses` – depende de `groups`, `group_members`.
9. `expense_splits` – depende de `expenses`, `group_members`.
10. `settlements` – depende de `groups`, `group_members`.
11. `payment_reminders` – depende de `groups`, `group_members`, usuarios.
12. `user_achievements` – depende de `user_profiles.user_id`.

## Índices

Los índices actuales cubren:

- **Auth**: `email_hash` (UNIQUE en `users`), `user_id` en sessions, `expires_at` en sessions y tokens.
- Claves foráneas: `group_id`, `member_id`, `expense_id`, `user_id`, `from_member_id`, `to_member_id`.
- Búsquedas: `friend_code`, `to_user_id`, `from_user_id`, `achievement_key`.

No se requieren cambios para D1.

## Migraciones versionadas

- Directorio: `migrations/`.
- Numeradas: `1.sql` … `9.sql` (y opcionalmente `N/down.sql` para rollback).
- Aplicar siempre en orden antes de desplegar el Worker.

## Resumen de tablas

| Tabla                       | PK              | Índices principales                              |
|-----------------------------|-----------------|--------------------------------------------------|
| users                       | id (TEXT/UUID)  | email_hash (UNIQUE), created_at                  |
| sessions                    | id (TEXT/UUID)  | user_id, expires_at                              |
| email_verification_tokens   | id (AUTOINCR.)  | user_id, token (UNIQUE), expires_at              |
| password_reset_tokens       | id (AUTOINCR.)  | user_id, token (UNIQUE), expires_at              |
| user_profiles               | id (AUTOINCR.)  | user_id (UNIQUE), friend_code (UNIQUE)           |
| groups                      | id              | created_by                                       |
| group_members               | id              | group_id, user_id                                |
| expenses                    | id              | group_id, paid_by_member_id                      |
| expense_splits              | id              | expense_id, member_id                            |
| settlements                 | id              | group_id, from_member_id, to_member_id           |
| payment_reminders           | id              | to_user_id, from_user_id                         |
| user_achievements           | id              | user_id, achievement_key (UNIQUE compuesto)      |

Este documento es la referencia del diseño en D1; el código fuente del esquema son los ficheros en `migrations/`.
