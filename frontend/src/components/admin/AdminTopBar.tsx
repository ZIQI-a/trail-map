import {
  BellOutlined,
  LockOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Input, Tag } from "antd";
import { topBarIcon } from "../../admin/config";
import type { AdminSection } from "../../admin/types";
import type { AppUserDto } from "../../types/auth";
import styles from "./AdminShell.module.css";

type AdminTopBarProps = {
  activeSection: AdminSection;
  currentUser: AppUserDto;
  isRefreshing: boolean;
  searchKeyword: string;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
};

// 顶部工具栏统一收口搜索、刷新和当前管理员信息。
export function AdminTopBar({
  activeSection,
  currentUser,
  isRefreshing,
  searchKeyword,
  onRefresh,
  onSearchChange,
}: AdminTopBarProps) {
  const activeSectionLabel =
    activeSection === "overview"
      ? "数据概览"
      : activeSection === "users"
        ? "用户管理"
        : activeSection === "cities"
          ? "城市管理"
          : "景点管理";

  const searchPlaceholder =
    activeSection === "users"
      ? "搜索用户、角色、状态等"
      : activeSection === "cities"
        ? "搜索城市名称、省份、编码等"
        : activeSection === "spots"
          ? "搜索景点名称、城市、类型等"
          : "搜索后台数据";

  return (
    <header className={styles.topBar}>
      <div className={styles.pagePath}>
        {topBarIcon}
        <span>首页</span>
        <em>/</em>
        <strong>{activeSectionLabel}</strong>
      </div>

      <div className={styles.topBarActions}>
        <Input
          className={styles.searchInput}
          prefix={<SearchOutlined />}
          placeholder={searchPlaceholder}
          value={searchKeyword}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Button className={styles.iconButton} icon={<BellOutlined />} />
        <Button
          className={styles.iconButton}
          icon={<ReloadOutlined />}
          loading={isRefreshing}
          onClick={onRefresh}
        />
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
        </div>
      </div>
    </header>
  );
}
