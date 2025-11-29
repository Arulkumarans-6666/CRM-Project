import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// We wrap the export in a function to correctly handle environment variables
export default defineConfig(({ mode }) => {
  
  // This line loads variables from your .env files for the config
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // This proxy is essential for local development
      proxy: {
        '/api': {
          // It redirects requests from '/api' to your local backend server
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});