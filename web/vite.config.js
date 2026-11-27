import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dev-only: mounts the local Express API on the Vite dev server.
 *
 * IMPORTANT: this must never be evaluated by `vite build`.
 * - `apply: 'serve'` removes the plugin entirely from production builds.
 * - The backend entry is imported via a runtime-computed file URL with `@vite-ignore`,
 *   so Vite's config bundler cannot statically follow it into `backend/` (whose
 *   dependencies are not installed in the `web` CI job or the Vercel web build).
 */
function embeddedExpressApiPlugin() {
  return {
    name: 'victorio-abc-embedded-express-api',
    apply: 'serve',
    async configureServer(server) {
      try {
        const backendEntry = pathToFileURL(
          path.resolve(__dirname, '../backend/src/app.js')
        ).href;
        const { default: backendApp } = await import(/* @vite-ignore */ backendEntry);
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api/') || req.url === '/health')) {
            return backendApp(req, res, next);
          }
          return next();
        });
      } catch (err) {
        console.warn('[Vite API Middleware] Could not attach embedded backend:', err?.message);
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'serve' ? [embeddedExpressApiPlugin()] : [])],
  server: {
    port: 5173,
  },
}));
