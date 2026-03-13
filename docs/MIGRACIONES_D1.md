# Migraciones Cloudflare D1

## Aplicar migraciones (esquema)

Las migraciones están en `migrations/` en orden numérico: `1.sql` … `8.sql`. Deben aplicarse en ese orden.

### Opción 1: Script npm (recomendado)

```bash
npm run d1:migrate
```

Aplica todas las migraciones contra la base **remota** configurada en `wrangler.json` (primer binding D1). Para base local:

```bash
npm run d1:migrate:local
```

### Opción 2: Manual con Wrangler

Sustituye `TU_DATABASE_NAME` por el `database_name` de tu binding en `wrangler.json` (o el nombre visible en el dashboard).

**Remoto (producción/staging):**

```bash
npx wrangler d1 execute TU_DATABASE_NAME --remote --file=./migrations/1.sql
npx wrangler d1 execute TU_DATABASE_NAME --remote --file=./migrations/2.sql
# ... hasta 8.sql
```

**Local (desarrollo):**

```bash
npx wrangler d1 execute TU_DATABASE_NAME --local --file=./migrations/1.sql
# ...
```

### Comprobar que el esquema está aplicado

```bash
npx wrangler d1 execute TU_DATABASE_NAME --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Deberías ver: `expense_splits`, `expenses`, `group_members`, `groups`, `payment_reminders`, `settlements`, `user_achievements`, `user_profiles`.

## Rollback (down)

En las carpetas `migrations/N/down.sql` hay scripts para deshacer cada migración. Úsalos solo si necesitas revertir en desarrollo; en producción conviene evitar drops. Ejemplo:

```bash
npx wrangler d1 execute TU_DATABASE_NAME --remote --file=./migrations/8/down.sql
# ... en orden inverso (8 → 1)
```

## Importar datos desde SQLite (opcional)

Si en el futuro tuvieras un dump SQLite (por ejemplo un `.dump` de SQLite o un export SQL):

1. **Exportar desde SQLite** (en tu máquina, con SQLite instalado):
   ```bash
   sqlite3 mi_base.db .dump > dump.sql
   ```
   Opcional: editar `dump.sql` para quitar `CREATE TABLE`/índices si ya existen en D1 y dejar solo `INSERT`.

2. **Importar a D1** (solo datos, asumiendo que el esquema ya está aplicado):
   - Dividir el dump en sentencias válidas (sin características no soportadas).
   - Ejecutar por lotes con `wrangler d1 execute ... --file=...` o usando el script `scripts/import-sqlite-dump.js` (si existe) que lee un archivo y ejecuta INSERTs por lotes.

3. **Validación**: comparar conteos por tabla en SQLite y en D1:
   ```bash
   npx wrangler d1 execute TU_DATABASE_NAME --remote --command "SELECT 'user_profiles', COUNT(*) FROM user_profiles UNION ALL SELECT 'groups', COUNT(*) FROM groups;"
   ```

## Orden recomendado antes de cada despliegue

1. Aplicar migraciones pendientes a la base del entorno (remoto o local).
2. Desplegar la aplicación (`npm run deploy`).
