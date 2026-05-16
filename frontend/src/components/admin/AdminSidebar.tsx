import { ArrowLeftOutlined, LockOutlined, LogoutOutlined } from "@ant-design/icons";
import { Avatar, Button } from "antd";
import { adminNavItems } from "../../admin/config";
import type { AdminSection } from "../../admin/types";
import type { AppUserDto } from "../../types/auth";
import styles from "./AdminShell.module.css";

type AdminSidebarProps = {
  activeSection: AdminSection;
  currentUser: AppUserDto;
  onBack: () => void;
  onChangeSection: (section: AdminSection) => void;
  onLogout: () => void;
};

// 管理端侧边栏统一放到通用组件目录，便于后续后台模块复用。
export function AdminSidebar({
  activeSection,
  currentUser,
  onBack,
  onChangeSection,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className={styles.sideRail}>
      <div className={styles.brandArea}>
        <img src="/header_logo.png" alt="行迹旅图 TrailMap" />
        <span>TrailMap Admin</span>
      </div>

      <nav className={styles.sideMenu}>
        {adminNavItems.map((item) => {
          const active = item.key === activeSection;
          return (
            <button
              className={active ? styles.sideMenuItemActive : styles.sideMenuItem}
              type="button"
              key={item.key}
              onClick={() => onChangeSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.sideFooter}>
        <div className={styles.adminProfile}>
          <Avatar
            size={42}
            src={currentUser.avatarUrl || undefined}
            icon={<LockOutlined />}
          />
          <div>
            <strong>{currentUser.nickname}</strong>
            <span>管理员控制台</span>
          </div>
        </div>

        <Button block icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回地图
        </Button>
        <Button block danger ghost icon={<LogoutOutlined />} onClick={onLogout}>
          退出登录
        </Button>
      </div>
    </aside>
  );
}
