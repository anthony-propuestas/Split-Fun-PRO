# Monitorización y optimización con Cloudflare D1

## Logs y errores D1 en el Worker

La capa de acceso a datos ([src/worker/db.ts](../src/worker/db.ts)) ya registra errores de D1 con el prefijo `[D1]`:

- `queryOne`: errores al ejecutar una query que devuelve una fila.
- `queryAll`: errores al ejecutar una query que devuelve varias filas.
- `run`: errores en INSERT/UPDATE/DELETE.

Estos mensajes aparecen en **Cloudflare Dashboard** → Workers & Pages → tu proyecto → Logs (Real-time o Logpush si lo tienes configurado). Busca `[D1]` para filtrar fallos de base de datos.

## Observabilidad en el proyecto

En [wrangler.json](../wrangler.json) está activado:

```json
"observability": { "enabled": true }
```

Eso permite usar Workers Analytics y métricas desde el dashboard. Revisa:

- **Workers & Pages** → tu proyecto → **Metrics**: solicitudes, errores, latencia.
- **D1** → tu base de datos → métricas de lecturas/escrituras y latencia de queries.

## Alertas recomendadas

1. **Tasa de error** del Worker por encima de un umbral (ej. 5 % durante 5 minutos).
2. **Latencia p95** del Worker o de D1 por encima de un valor aceptable (ej. 500 ms).
3. **Errores 5xx** en endpoints críticos (login, creación de grupo/gasto).

Configuración típica en **Cloudflare Dashboard** → Notifications → Create (alertas por email/webhook cuando se cumplan condiciones en Analytics o en D1).

## Optimización continua

- **Queries lentas**: revisa los logs y las métricas de D1; identifica consultas que aparezcan mucho o con latencia alta. Añade o ajusta índices en nuevas migraciones si hace falta.
- **Datos fríos**: si alguna tabla crece mucho (p. ej. logs o historial antiguo), valora archivar datos viejos en R2 o en otra solución y mantener en D1 solo datos recientes.
- **Documentación**: mantén actualizado [docs/ESQUEMA_D1.md](./ESQUEMA_D1.md) y el inventario [docs/INVENTARIO_BASE_DE_DATOS.md](./INVENTARIO_BASE_DE_DATOS.md) cuando añadas tablas o cambies patrones de acceso.
