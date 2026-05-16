import { ConfigProvider } from "antd";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminConsolePage } from "./pages/admin-console";
import { MapWorkbenchPage } from "./pages/map-workbench";

// App 是前端应用根组件，当前挂载阶段 2 的地图工作台页面。
function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2266e8",
          borderRadius: 8,
          fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 34,
            fontWeight: 700,
          },
          Segmented: {
            itemSelectedBg: "#2266e8",
            itemSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapWorkbenchPage />} />
          <Route path="/admin" element={<AdminConsolePage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
