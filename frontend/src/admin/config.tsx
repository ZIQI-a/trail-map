import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  LockOutlined,
  PushpinOutlined,
  RiseOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import type { AppUserDto } from "../types/auth";
import type { AdminSection, AdminStatusFilter } from "./types";

export const roleOptions = [
  { label: "普通用户", value: "normal" },
  { label: "会员", value: "member" },
  { label: "管理员", value: "admin" },
] satisfies Array<{ label: string; value: AppUserDto["userType"] }>;

export const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "启用中", value: "enabled" },
  { label: "已停用", value: "disabled" },
] satisfies Array<{ label: string; value: AdminStatusFilter }>;

export const adminNavItems = [
  { key: "overview", label: "数据概览", icon: <BarChartOutlined /> },
  { key: "users", label: "用户管理", icon: <TeamOutlined /> },
  { key: "cities", label: "城市管理", icon: <EnvironmentOutlined /> },
  { key: "spots", label: "景点管理", icon: <PushpinOutlined /> },
] satisfies Array<{
  key: AdminSection;
  label: string;
  icon: ReactNode;
}>;

export const overviewCardConfigs = [
  { key: "totalUsers", title: "用户总数", icon: <TeamOutlined />, trend: "近 7 日持续增长" },
  { key: "enabledUsers", title: "启用账号", icon: <AlertOutlined />, trend: "账号状态稳定" },
  { key: "adminUsers", title: "管理员账号", icon: <LockOutlined />, trend: "后台权限受控" },
  { key: "memberUsers", title: "会员用户", icon: <RiseOutlined />, trend: "会员体系可扩展" },
] satisfies Array<{
  key: "totalUsers" | "enabledUsers" | "adminUsers" | "memberUsers";
  title: string;
  icon: ReactNode;
  trend: string;
}>;

export const userCardConfigs = [
  { key: "totalUsers", title: "用户总数", icon: <TeamOutlined /> },
  { key: "activeUsers", title: "近期活跃", icon: <RiseOutlined /> },
  { key: "enabledUsers", title: "正常账号", icon: <UserOutlined /> },
  { key: "disabledUsers", title: "已停用", icon: <AlertOutlined /> },
] satisfies Array<{
  key: "totalUsers" | "activeUsers" | "enabledUsers" | "disabledUsers";
  title: string;
  icon: ReactNode;
}>;

export const topBarIcon = <AppstoreOutlined />;
