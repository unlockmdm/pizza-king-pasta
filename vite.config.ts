import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative so the build works on any host or sub-path.
// Build output goes to dist/static so it never collides with public/assets (menu photos).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { assetsDir: 'static' },
});
