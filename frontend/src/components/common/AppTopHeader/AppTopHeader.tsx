import {
  AppstoreOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  IdcardOutlined,
  LogoutOutlined,
  ReadOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppUserDto } from "../../../types/auth";
import styles from "./AppTopHeader.module.css";

interface AppTopHeaderProps {
  centerSlot?: ReactNode;
  currentUser?: AppUserDto;
  loginText?: string;
  onAuthClick?: () => void;
  onLogout?: () => void;
  rightSlot?: ReactNode;
  surface?: "default" | "workbench";
}

// AppTopHeader 只承接全站通用顶部第一行：左侧品牌固定，中间/右侧操作可由页面注入。
export function AppTopHeader({
  centerSlot,
  currentUser,
  loginText = "登录",
  onAuthClick,
  onLogout,
  rightSlot,
  surface = "default",
}: AppTopHeaderProps) {
  const navigate = useNavigate();
  const headerClassName = `${styles.topHeader} ${
    surface === "workbench" ? styles.workbenchSurface : ""
  }`;
  const accountMenuItems = buildAccountMenuItems({
    currentUser,
    navigate,
    onLogout,
  });

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

// 用户头像入口统一收口到通用 Header，避免各页面重复实现账号菜单。
function renderAccountEntry({
  accountMenuItems,
  currentUser,
  loginText,
  onAuthClick,
}: Pick<
  AppTopHeaderProps,
  "currentUser" | "loginText" | "onAuthClick"
> & {
  accountMenuItems: ReturnType<typeof buildAccountMenuItems>;
}) {
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

function buildAccountMenuItems({
  currentUser,
  navigate,
  onLogout,
}: {
  currentUser?: AppUserDto;
  navigate: ReturnType<typeof useNavigate>;
  onLogout?: () => void;
}) {
  if (!currentUser) {
    return [];
  }

  return [
    {
      key: "account",
      label: `${getUserTypeLabel(currentUser.userType)} · ${currentUser.username}`,
      disabled: true,
    },
    {
      key: "profile",
      label: "个人主页",
      icon: <IdcardOutlined />,
      onClick: () => navigate("/profile"),
    },
    ...(currentUser.userType === "admin"
      ? [
          {
            key: "admin",
            label: "后台管理",
            icon: <AppstoreOutlined />,
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      key: "favorites",
      label: "我的收藏",
      icon: <HeartOutlined />,
      onClick: () => navigate("/favorites"),
    },
    {
      key: "checkins",
      label: "我的足迹",
      icon: <EnvironmentOutlined />,
      onClick: () => navigate("/checkins"),
    },
    {
      key: "trips",
      label: "我的行程",
      icon: <ReadOutlined />,
      onClick: () => navigate("/trips"),
    },
    {
      key: "logout",
      label: "退出登录",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: onLogout,
    },
  ];
}

function getUserTypeLabel(userType: AppUserDto["userType"]) {
  switch (userType) {
    case "admin":
      return "管理员";
    case "member":
      return "会员";
    default:
      return "普通用户";
  }
}
