import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import { queryClient } from './lib/queryClient';
import './styles/global.css';
import App from './App';

// 全局注入阿里 iconfont SVG 雪碧图，供业务多色图标通过 <use> 复用。
ensureIconfontSprite('/font_icon/iconfont.js');

// 前端入口：把 React 应用挂载到 index.html 的 root 节点。
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

function ensureIconfontSprite(src: string) {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.querySelector(`script[data-iconfont-src="${src}"]`)) {
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.setAttribute('data-iconfont-src', src);
  document.body.appendChild(script);
}
