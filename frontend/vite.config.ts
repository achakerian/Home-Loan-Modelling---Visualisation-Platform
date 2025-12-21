import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@calc-engine/core': path.resolve(__dirname, '../calc-engine/src')
    }
  },
  server: {
    port: 5173
  }
});
