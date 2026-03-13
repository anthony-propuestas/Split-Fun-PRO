# Pruebas con Cloudflare D1

## Comprobar esquema en un entorno

Tras aplicar migraciones (`npm run d1:migrate` o `d1:migrate:local`), verifica que las tablas existen:

```bash
npm run d1:verify        # base remota
npm run d1:verify:local   # base local
```

O manualmente (sustituye `DB_NAME` por el `database_name` de `wrangler.json`):

```bash
npx wrangler d1 execute DB_NAME --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Deberías ver: `expense_splits`, `expenses`, `group_members`, `groups`, `payment_reminders`, `settlements`, `user_achievements`, `user_profiles`.

## Probar la aplicación en desarrollo

1. **Base D1 local** (opcional): crea una base local y aplica migraciones.
   ```bash
   npm run d1:migrate:local
   ```
   (Requiere que en `wrangler.json` la base configurada exista también en modo local.)

2. **Levantar el front y el Worker**:
   ```bash
   npm run dev
   ```
   El plugin de Cloudflare (Vite) inyecta los bindings; si tienes `.dev.vars` con variables (p. ej. `GOOGLE_CLIENT_ID`), se cargan ahí.

3. **Probar flujos críticos**:
   - Login (Google One Tap) y comprobar que se crea/actualiza perfil en D1.
   - Crear grupo, añadir gasto, repartir, ver balance.
   - Ver dashboard, detalle de grupo, settlements, recordatorios, logros.

## Pruebas manuales de regresión (staging)

Si tienes un entorno de staging (otra base D1 + despliegue Preview):

1. Aplica migraciones a la base de staging.
2. Despliega en modo Preview o a la URL de staging.
3. Repite los mismos flujos que en desarrollo y comprueba que los datos se leen/escriben bien y que las latencias son aceptables.

## Pruebas automatizadas (opcional)

Para tests E2E o de integración contra D1:

- **Local**: usa `wrangler d1 execute ... --local` para preparar datos de test y luego llama a tu Worker (por ejemplo con `fetch` al endpoint local).
- **Remoto (staging)**: usa la URL de tu Worker en staging y datos de prueba aislados (cuenta/test group).

No hay tests unitarios de base de datos en este repo por defecto; los pasos anteriores cubren validación manual y de regresión.
