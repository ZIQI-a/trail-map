import {
  CaretDownOutlined,
  LockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Tag } from "antd";
import type { MenuProps } from "antd";
import { topBarIcon } from "../../admin/config";
import type { AdminSection } from "../../admin/types";
import type { AppUserDto } from "../../types/auth";
import styles from "./AdminShell.module.css";

type AdminTopBarProps = {
  activeSection: AdminSection;
  currentUser: AppUserDto;
  onLogout: () => void;
};

// 顶部工具栏展示当前模块路径和管理员账户入口。
export function AdminTopBar({
  activeSection,
  currentUser,
  onLogout,
}: AdminTopBarProps) {
  const activeSectionLabel =
    activeSection === "overview"
      ? "数据概览"
      : activeSection === "users"
        ? "用户管理"
        : activeSection === "cities"
          ? "城市管理"
          : "景点管理";

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <header className={styles.topBar}>
      <div className={styles.pagePath}>
        {topBarIcon}
        <span>首页</span>
        <em>/</em>
        <strong>{activeSectionLabel}</strong>
      </div>

      <div className={styles.topBarActions}>
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={["hover"]}
          placement="bottomRight"
        >
          <button type="button" className={styles.topUserButton}>
            <div className={styles.topUser}>
              <Avatar
                size={40}
                src={currentUser.avatarUrl || undefined}
                icon={<LockOutlined />}
              />
              <div className={styles.topUserMeta}>
                <strong>{currentUser.nickname}</strong>
                <span>@{currentUser.username}</span>
              </div>
              <Tag color="blue">管理员</Tag>
              <CaretDownOutlined className={styles.topUserArrow} />
            </div>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
