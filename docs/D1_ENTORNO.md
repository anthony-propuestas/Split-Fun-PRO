# Configuración del entorno Cloudflare D1

## Bindings actuales

En [wrangler.json](../wrangler.json) está definido:

- **D1**: binding `DB` → base de datos principal (grupos, gastos, usuarios, etc.).
- **R2**: binding `R2_BUCKET` → almacenamiento de objetos.

El Worker y las Pages Functions reciben estos bindings en `c.env.DB` y `c.env.R2_BUCKET`.

## Crear una nueva base D1 (Cloudflare Dashboard)

1. Entra en [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → D1.
2. **Create database**: nombre sugerido `split-fun-pro-d1` (o `split-fun-pro-d1-dev` para desarrollo).
3. Anota el **Database ID** (UUID).
4. En tu proyecto, en **Workers & Pages** → tu proyecto **Pages** → Settings → Functions → D1 bindings, vincula la base con el binding `DB`.

## Crear base D1 por CLI (alternativa)

```bash
# Crear base (sustituye NOMBRE por ej. split-fun-pro-d1)
npx wrangler d1 create NOMBRE

# Salida incluye database_id. Actualiza wrangler.json con database_name y database_id.
```

## Entornos (development / staging / production)

Para usar bases D1 distintas por entorno:

1. Crea una base D1 para cada uno (p. ej. `split-fun-pro-d1-dev`, `split-fun-pro-d1-staging`, `split-fun-pro-d1-prod`).
2. En **Pages** → tu proyecto → Settings → **Environment variables** y **D1 bindings**, configura por entorno (Production, Preview) qué base usa cada uno.
3. Opcional: en el repo puedes tener un `wrangler.json` con sección `env` por entorno si usas `wrangler pages deploy` con `--env`.

Ejemplo de estructura con entornos en `wrangler.json` (opcional):

```json
{
  "name": "split-fun-pro",
  "pages_build_output_dir": "./dist",
  "d1_databases": [{ "binding": "DB", "database_name": "prod-db-name", "database_id": "UUID-PROD" }],
  "env": {
    "development": {
      "d1_databases": [{ "binding": "DB", "database_name": "dev-db-name", "database_id": "UUID-DEV" }]
    }
  }
}
```

Si usas solo el dashboard de Pages, los bindings por entorno se configuran ahí sin necesidad de tocar `wrangler.json` para cada entorno.

## Orden de despliegue

1. **Aplicar migraciones** a la base D1 del entorno correspondiente (ver [Tooling de migraciones](./MIGRACIONES_D1.md)).
2. **Desplegar** la aplicación (`npm run deploy` o `wrangler pages deploy dist`).

Así el esquema está actualizado antes de que el nuevo Worker use nuevas tablas o columnas.
