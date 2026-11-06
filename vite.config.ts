import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket collision and flickering during agent edits.
      hmr: process.env.DISABLE_HMR === 'false',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
