import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { adminNavItems } from "../../admin/config";
import type { AdminSection } from "../../admin/types";
import styles from "./AdminShell.module.css";

type AdminSidebarProps = {
  activeSection: AdminSection;
  collapsed: boolean;
  onChangeSection: (section: AdminSection) => void;
  onToggleCollapsed: () => void;
};

// 管理端侧边栏统一放到通用组件目录，便于后续后台模块复用。
export function AdminSidebar({
  activeSection,
  collapsed,
  onChangeSection,
  onToggleCollapsed,
}: AdminSidebarProps) {
  return (
    <aside
      className={
        collapsed
          ? `${styles.sideRail} ${styles.sideRailCollapsed}`
          : styles.sideRail
      }
    >
      <div className={styles.brandArea}>
        <img
          src={collapsed ? "/admin_logo_mark.png" : "/header_logo.png"}
          alt="行迹旅图 TrailMap"
        />
        {!collapsed ? <span>TrailMap 管理端</span> : null}
      </div>

      <nav className={styles.sideMenu}>
        {adminNavItems.map((item) => {
          const active = item.key === activeSection;
          return (
            <Tooltip
              key={item.key}
              placement="right"
              title={collapsed ? item.label : undefined}
            >
              <button
                className={
                  active ? styles.sideMenuItemActive : styles.sideMenuItem
                }
                type="button"
                onClick={() => onChangeSection(item.key)}
              >
                {item.icon}
                {!collapsed ? (
                  <span className={styles.sideMenuLabel}>{item.label}</span>
                ) : null}
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div className={styles.sideFooter}>
        <Tooltip title={collapsed ? "展开菜单" : undefined} placement="right">
          <Button
            aria-label={collapsed ? "展开菜单" : "收起菜单"}
            className={styles.collapseButton}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleCollapsed}
          >
            {!collapsed ? "收起菜单" : null}
          </Button>
        </Tooltip>
      </div>
    </aside>
  );
}
