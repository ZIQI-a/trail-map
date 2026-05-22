import { SmileOutlined } from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AppUserDto } from "../../../types/auth";
import styles from "./AppTopHeader.module.css";

interface AppTopHeaderProps {
  accountMenuItems?: MenuProps["items"];
  centerSlot?: ReactNode;
  currentUser?: AppUserDto;
  loginText?: string;
  onAuthClick?: () => void;
  rightSlot?: ReactNode;
  surface?: "default" | "workbench";
}

// AppTopHeader 只承接全站通用顶部第一行：左侧品牌固定，中间/右侧操作可由页面注入。
export function AppTopHeader({
  accountMenuItems,
  centerSlot,
  currentUser,
  loginText = "登录",
  onAuthClick,
  rightSlot,
  surface = "default",
}: AppTopHeaderProps) {
  const headerClassName = `${styles.topHeader} ${
    surface === "workbench" ? styles.workbenchSurface : ""
  }`;

  return (
    <div className={headerClassName}>
      <Link className={styles.brandArea} to="/" aria-label="返回行迹旅图首页">
        <img
          className={styles.brandLogo}
          src="/header_logo.png"
          alt="行迹旅图 TrailMap"
        />
      </Link>

      <div className={styles.centerSlot}>{centerSlot}</div>
      <div className={styles.rightSlot}>
        {rightSlot}
        {renderAccountEntry({
          accountMenuItems,
          currentUser,
          loginText,
          onAuthClick,
        })}
      </div>
    </div>
  );
}

// 用户头像
function renderAccountEntry({
  accountMenuItems,
  currentUser,
  loginText,
  onAuthClick,
}: Pick<
  AppTopHeaderProps,
  "accountMenuItems" | "currentUser" | "loginText" | "onAuthClick"
>) {
  if (currentUser) {
    return (
      <Dropdown trigger={["click"]} menu={{ items: accountMenuItems }}>
        <button className={styles.accountButton} type="button">
          <Avatar
            className={styles.accountAvatar}
            size={34}
            src={currentUser.avatarUrl || undefined}
            icon={<SmileOutlined />}
          />
          <span>{currentUser.nickname}</span>
        </button>
      </Dropdown>
    );
  }

  if (!onAuthClick) {
    return null;
  }

  return (
    <button
      className={styles.accountButton}
      type="button"
      onClick={onAuthClick}
    >
      <Avatar
        className={styles.accountAvatar}
        size={32}
        icon={<SmileOutlined />}
      />
      <span>{loginText}</span>
    </button>
  );
}
