import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './styles/global.css';
import App from './App';

// 前端入口：把 React 应用挂载到 index.html 的 root 节点。
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
