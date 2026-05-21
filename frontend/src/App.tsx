import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MapWorkbenchPage } from "./pages/map-workbench";
import { FavoritesPage } from "./pages/favorites";
import { MyTripsPage } from "./pages/trips";
import { NotFoundPage } from "./pages/not-found";

const AdminPage = lazy(() =>
  import("./pages/admin").then((module) => ({ default: module.AdminPage })),
);
const CheckinsPage = lazy(() =>
  import("./pages/checkins").then((module) => ({
    default: module.CheckinsPage,
  })),
);

// App 是前端应用根组件，当前挂载阶段 2 的地图工作台页面。
function App() {
  return (
    <ConfigProvider
      locale={zhCN}
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
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route
            path="/checkins"
            element={
              <Suspense fallback={null}>
                <CheckinsPage />
              </Suspense>
            }
          />
          <Route path="/trips" element={<MyTripsPage />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={null}>
                <AdminPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
