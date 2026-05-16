import {
  AlertOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Input, Select, Statistic, Switch, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { roleOptions, statusOptions, userCardConfigs } from "../../../admin/config";
import type { AdminStatusFilter } from "../../../admin/types";
import type { AppUserDto } from "../../../types/auth";
import { formatAdminDateTime, getAdminUserRoleMeta } from "../../../utils/admin/format";
import sectionStyles from "./AdminSections.module.css";

type OverviewStats = {
  totalUsers: number;
  enabledUsers: number;
};

type AdminUsersSectionProps = {
  currentUserId?: number;
  filteredUsers: AppUserDto[];
  isLoading: boolean;
  isUpdating: boolean;
  overviewStats: OverviewStats;
  searchKeyword: string;
  roleFilter: "all" | AppUserDto["userType"];
  statusFilter: AdminStatusFilter;
  tableError?: Error | null;
  users: AppUserDto[];
  onResetFilters: () => void;
  onRoleFilterChange: (value: "all" | AppUserDto["userType"]) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: AdminStatusFilter) => void;
  onToggleStatus: (user: AppUserDto) => void;
  onUpdateRole: (user: AppUserDto, nextRole: AppUserDto["userType"]) => void;
};

// 用户管理模块直接在表格中展示主要字段，避免当前阶段再引入详情侧栏。
export function AdminUsersSection({
  currentUserId,
  filteredUsers,
  isLoading,
  isUpdating,
  overviewStats,
  roleFilter,
  searchKeyword,
  statusFilter,
  tableError,
  users,
  onResetFilters,
  onRoleFilterChange,
  onSearchChange,
  onStatusFilterChange,
  onToggleStatus,
  onUpdateRole,
}: AdminUsersSectionProps) {
  const activeUsers = users.filter((user) => Boolean(user.lastLoginAt)).length;
  const disabledUsers = users.filter((user) => user.status !== 1).length;

  const columns = useMemo<ColumnsType<AppUserDto>>(
    () => [
      {
        title: "用户",
        dataIndex: "username",
        key: "username",
        width: 220,
        render: (_, user) => (
          <div className={sectionStyles.userCell}>
            <Avatar
              size={36}
              src={user.avatarUrl || undefined}
              icon={<UserOutlined />}
            />
            <div className={sectionStyles.userIdentity}>
              <strong>{user.nickname}</strong>
              <span>@{user.username}</span>
            </div>
          </div>
        ),
      },
      {
        title: "手机号",
        dataIndex: "phone",
        key: "phone",
        width: 140,
        render: (value) => value || "--",
      },
      {
        title: "邮箱",
        dataIndex: "email",
        key: "email",
        width: 220,
        render: (value) => value || "--",
      },
      {
        title: "角色",
        dataIndex: "userType",
        key: "userType",
        width: 140,
        render: (userType, user) => {
          const roleMeta = getAdminUserRoleMeta(userType);
          return (
            <div className={sectionStyles.roleCell}>
              <Tag color={roleMeta.tagColor}>{roleMeta.label}</Tag>
              <Select
                className={sectionStyles.inlineSelect}
                value={userType}
                options={roleOptions}
                disabled={currentUserId === user.id}
                onChange={(nextRole) => onUpdateRole(user, nextRole as AppUserDto["userType"])}
              />
            </div>
          );
        },
      },
      {
        title: "账号状态",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (status, user) => (
          <div className={sectionStyles.statusCell}>
            <Tag color={status === 1 ? "success" : "error"}>
              {status === 1 ? "正常" : "停用"}
            </Tag>
            <Switch
              size="small"
              checked={status === 1}
              disabled={currentUserId === user.id}
              onChange={() => onToggleStatus(user)}
            />
          </div>
        ),
      },
      {
        title: "注册时间",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 168,
        render: (value) => formatAdminDateTime(value),
      },
      {
        title: "最近登录",
        dataIndex: "lastLoginAt",
        key: "lastLoginAt",
        width: 168,
        render: (value) => formatAdminDateTime(value),
      },
    ],
    [currentUserId, onToggleStatus, onUpdateRole],
  );

  const userStatValueMap = {
    totalUsers: overviewStats.totalUsers,
    activeUsers,
    enabledUsers: overviewStats.enabledUsers,
    disabledUsers,
  };

  const userStatIconMap = {
    totalUsers: <TeamOutlined />,
    activeUsers: <RiseOutlined />,
    enabledUsers: <CheckCircleOutlined />,
    disabledUsers: <AlertOutlined />,
  };

  return (
    <section className={sectionStyles.contentGridSingle}>
      <div className={sectionStyles.mainColumn}>
        <div className={sectionStyles.pageHeading}>
          <h1>用户管理</h1>
          <p>统一查看注册用户、角色类型、账号状态与最近登录情况。</p>
        </div>

        <div className={sectionStyles.filterBar}>
          <Input
            className={sectionStyles.filterInput}
            prefix={<SearchOutlined />}
            placeholder="昵称 / 用户名 / 手机号 / 邮箱"
            value={searchKeyword}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Select
            className={sectionStyles.filterSelect}
            value={roleFilter}
            options={[{ label: "全部角色", value: "all" }, ...roleOptions]}
            onChange={(value) => onRoleFilterChange(value as "all" | AppUserDto["userType"])}
          />
          <Select
            className={sectionStyles.filterSelect}
            value={statusFilter}
            options={statusOptions}
            onChange={(value) => onStatusFilterChange(value as AdminStatusFilter)}
          />
          <Button onClick={onResetFilters}>重置</Button>
        </div>

        <div className={sectionStyles.statGrid}>
          {userCardConfigs.map((item) => (
            <Card className={sectionStyles.statCard} key={item.key}>
              <Statistic
                title={item.title}
                value={userStatValueMap[item.key]}
                prefix={userStatIconMap[item.key]}
              />
            </Card>
          ))}
        </div>

        <Card className={sectionStyles.tableCard} bodyStyle={{ padding: 0 }}>
          {tableError ? (
            <div className={sectionStyles.tableState}>
              <Alert
                type="error"
                showIcon
                message="用户列表加载失败"
                description={tableError.message || "暂时无法获取用户数据"}
              />
            </div>
          ) : (
            <Table
              rowKey="id"
              className={sectionStyles.userTable}
              loading={isLoading || isUpdating}
              columns={columns}
              dataSource={filteredUsers}
              pagination={false}
              scroll={{ x: 1100 }}
            />
          )}
        </Card>
      </div>
    </section>
  );
}
