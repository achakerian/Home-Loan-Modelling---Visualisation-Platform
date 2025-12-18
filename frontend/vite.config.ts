import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const base = process.env.VITE_BASE ?? './';

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173
  }
});
