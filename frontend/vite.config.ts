import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：当前只启用 React 插件，后续地图和代理配置会在这里扩展。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
