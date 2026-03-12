## Split Fun

This app was created using https://getmocha.com.
Need help or want to join the community? Join our [Discord](https://discord.gg/shDEGBSe2d).

To run the devserver:
```
npm install
npm run dev
```

### Despliegue en Cloudflare Pages

Si el build falla con *"Error al instalar herramientas o dependencias"*:

1. **Versión de Node**: En el proyecto hay un `.nvmrc` con Node 20. En Cloudflare (Settings → Environment variables) añade `NODE_VERSION` = `20` para el entorno de build.

2. **Si sigue fallando**: Usa instalación con resolución flexible de dependencias:
   - Añade la variable de entorno: `SKIP_DEPENDENCY_INSTALL` = `true`
   - En **Build command** pon: `npm install --legacy-peer-deps && npm run build`
   - **Build output directory**: el que use tu proyecto (p. ej. `dist` si lo indica Vite/Wrangler).

3. Asegúrate de que `package-lock.json` está en el repositorio y subido.
