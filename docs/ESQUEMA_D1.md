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

1. `user_profiles` – independiente.
2. `groups` – depende de `user_profiles.user_id` (created_by).
3. `group_members` – depende de `groups`, opcionalmente `user_profiles`.
4. `expenses` – depende de `groups`, `group_members`.
5. `expense_splits` – depende de `expenses`, `group_members`.
6. `settlements` – depende de `groups`, `group_members`.
7. `payment_reminders` – depende de `groups`, `group_members`, usuarios.
8. `user_achievements` – depende de `user_profiles.user_id`.

## Índices

Los índices actuales cubren:

- Claves foráneas: `group_id`, `member_id`, `expense_id`, `user_id`, `from_member_id`, `to_member_id`.
- Búsquedas: `friend_code`, `to_user_id`, `from_user_id`, `achievement_key`.

No se requieren cambios para D1.

## Migraciones versionadas

- Directorio: `migrations/`.
- Numeradas: `1.sql` … `8.sql` (y opcionalmente `N/down.sql` para rollback).
- Aplicar siempre en orden antes de desplegar el Worker.

## Resumen de tablas

| Tabla               | PK    | Índices principales                          |
|---------------------|-------|-----------------------------------------------|
| groups              | id    | created_by                                    |
| group_members       | id    | group_id, user_id                             |
| expenses            | id    | group_id, paid_by_member_id                   |
| expense_splits      | id    | expense_id, member_id                         |
| user_profiles       | id    | user_id (UNIQUE), friend_code (UNIQUE)        |
| settlements         | id    | group_id, from_member_id, to_member_id        |
| payment_reminders   | id    | to_user_id, from_user_id                      |
| user_achievements   | id    | user_id, achievement_key (UNIQUE compuesto)   |

Este documento es la referencia del diseño en D1; el código fuente del esquema son los ficheros en `migrations/`.
