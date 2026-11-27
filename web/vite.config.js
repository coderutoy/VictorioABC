import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function embeddedExpressApiPlugin() {
  return {
    name: 'victorio-abc-embedded-express-api',
    async configureServer(server) {
      try {
        const { default: backendApp } = await import('../backend/src/app.js');
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

export default defineConfig({
  plugins: [react(), embeddedExpressApiPlugin()],
  server: {
    port: 5173,
  },
});
