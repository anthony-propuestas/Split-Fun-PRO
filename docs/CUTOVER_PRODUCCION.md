# Plan de cutover a producción (D1)

Este checklist aplica cuando migras datos desde otra base (p. ej. SQLite) a D1 en producción, o cuando haces un despliegue importante con ventana de mantenimiento.

## Antes del día del cutover

- [ ] Tener una base D1 de producción creada y vinculada al proyecto (binding `DB`) en el dashboard de Cloudflare.
- [ ] Haber probado el esquema y la aplicación en staging con una copia de datos realista.
- [ ] Tener los scripts de migración listos: `npm run d1:migrate` (y si aplica, script de importación desde SQLite).
- [ ] Definir la ventana de mantenimiento y comunicarla (ej. “Martes 00:00–02:00 UTC”).
- [ ] Preparar rollback: copia de la versión anterior del Worker y, si hubiera, backup de la base actual (SQLite u otra).

## Checklist el día del cutover

1. **Activar modo mantenimiento** (si tu app lo soporta) o avisar que la app no estará disponible.
2. **Comprobar que no hay escrituras activas** en la base actual (tráfico detenido o redirección a página de mantenimiento).
3. **Exportar datos** desde la base actual (si migras desde SQLite: `sqlite3 mi_base.db .dump > dump.sql` o equivalente).
4. **Aplicar esquema en D1** (si aún no está): `npm run d1:migrate`.
5. **Importar datos** en D1 (si aplica: script de importación o `scripts/import-sqlite-dump.js dump.sql`).
6. **Validar integridad**: `npm run d1:verify` y comprobaciones de conteos por tabla (comparar con la base origen).
7. **Desplegar la aplicación** que usa D1: `npm run deploy` (o tu flujo habitual).
8. **Desactivar modo mantenimiento** y comprobar que login, dashboard, grupos y gastos responden bien.
9. **Monitorizar** errores y latencias durante al menos 30–60 minutos (ver [MONITORIZACION_D1.md](./MONITORIZACION_D1.md)).

## Rollback

Si algo falla durante el cutover:

- **Punto de no retorno**: una vez que hay escrituras nuevas en D1, volver atrás implica perder esas escrituras o tener que re-migrar; decide si es aceptable.
- **Volver a la versión anterior**: re-despliega la versión previa del Worker/Pages que apuntaba a la base antigua (o a un backup).
- **Mantener** la copia de la base antigua (SQLite u otra) hasta confirmar que D1 está estable y no se necesita rollback.

## Si la app ya usa solo D1

Si no tienes migración desde otra base y solo despliegas cambios de código:

1. Aplicar migraciones pendientes a la base de producción: `npm run d1:migrate`.
2. Desplegar: `npm run deploy`.
3. Monitorizar tras el despliegue.
