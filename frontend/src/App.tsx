import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MapWorkbenchPage } from "./pages/map-workbench";
import { NotFoundPage } from "./pages/not-found";

// 非首页页面统一改为按路由懒加载，避免首页首包提前打入个人中心、收藏、行程等模块。
const ProfilePage = lazy(() =>
  import("./pages/profile").then((module) => ({ default: module.ProfilePage })),
);
const ProfileEditPage = lazy(() =>
  import("./pages/profile").then((module) => ({
    default: module.ProfileEditPage,
  })),
);
const FavoritesPage = lazy(() =>
  import("./pages/favorites").then((module) => ({
    default: module.FavoritesPage,
  })),
);
const MyTripsPage = lazy(() =>
  import("./pages/trips").then((module) => ({ default: module.MyTripsPage })),
);
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
          <Route path="/profile" element={renderLazyRoute(<ProfilePage />)} />
          <Route
            path="/profile/edit"
            element={renderLazyRoute(<ProfileEditPage />)}
          />
          <Route
            path="/favorites"
            element={renderLazyRoute(<FavoritesPage />)}
          />
          <Route
            path="/checkins"
            element={renderLazyRoute(<CheckinsPage />)}
          />
          <Route path="/trips" element={renderLazyRoute(<MyTripsPage />)} />
          <Route
            path="/admin"
            element={renderLazyRoute(<AdminPage />)}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

/**
 * 统一包装路由级懒加载节点，避免各个 Route 重复书写 Suspense 结构。
 */
function renderLazyRoute(node: ReactNode) {
  return <Suspense fallback={null}>{node}</Suspense>;
}

export default App;
