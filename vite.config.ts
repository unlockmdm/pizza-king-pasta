import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handlePay } from './server/square';

/** Serves POST /api/pay from the dev server, with the same handler Vercel runs in production. */
function squareApi(env: Record<string, string>): Plugin {
  return {
    name: 'square-api',
    configureServer(server) {
      server.middlewares.use('/api/pay', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let text = '';
        for await (const chunk of req) text += chunk;
        let body: unknown = {};
        try { body = JSON.parse(text || '{}'); } catch { /* handled as invalid input */ }
        const out = await handlePay(body, env);
        res.statusCode = out.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(out.json));
      });
    },
  };
}

// base './' keeps every asset path relative so the build works on any host or sub-path.
// Build output goes to dist/static so it never collides with public/assets (menu photos).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // includes non-VITE secrets, server-side only
  return {
    base: './',
    plugins: [react(), squareApi(env)],
    build: { assetsDir: 'static' },
  };
});
