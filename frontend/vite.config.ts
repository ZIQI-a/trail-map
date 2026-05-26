import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 根据依赖域拆分第三方包，优先降低首页首包体积，并避免大库全部滚入单一 vendor chunk。
 */
function buildManualChunks(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }
  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router-dom/')
  ) {
    return 'react-vendor';
  }
  if (id.includes('/antd/') || id.includes('/@ant-design/')) {
    return 'antd-vendor';
  }
  if (id.includes('/@tanstack/react-query/')) {
    return 'query-vendor';
  }
  if (id.includes('/@antv/l7')) {
    return 'map-vendor';
  }
  if (id.includes('/echarts/') || id.includes('/echarts-for-react/')) {
    return 'chart-vendor';
  }
  return undefined;
}

// Vite 配置：保留本地代理，同时为生产构建增加手动拆包规则。
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: buildManualChunks,
      },
    },
  },
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
