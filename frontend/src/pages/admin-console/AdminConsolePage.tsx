import {
  ArrowLeftOutlined,
  DashboardOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Select,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminUsersQuery, useAdminUserUpdateMutation } from "../../hooks/useAdminData";
import { useCurrentUserQuery } from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import { queryClient } from "../../lib/queryClient";
import type { AppUserDto } from "../../types/auth";
import styles from "./AdminConsolePage.module.css";

const roleOptions = [
  { label: "普通用户", value: "normal" },
  { label: "会员", value: "member" },
  { label: "管理员", value: "admin" },
] satisfies Array<{ label: string; value: AppUserDto["userType"] }>;

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "启用中", value: "enabled" },
  { label: "已停用", value: "disabled" },
] as const;

// AdminConsolePage 作为独立后台模块首页，当前先承接管理员用户管理能力。
export function AdminConsolePage() {
  const navigate = useNavigate();
  const authToken = getAuthToken();
  const [roleFilter, setRoleFilter] = useState<"all" | AppUserDto["userType"]>("all");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]["value"]>("all");
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const usersQuery = useAdminUsersQuery(
    1,
    20,
    Boolean(authToken) && currentUserQuery.data?.userType === "admin",
  );
  const userUpdateMutation = useAdminUserUpdateMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const currentUser = currentUserQuery.data;
  const users = useMemo(() => usersQuery.data?.list ?? [], [usersQuery.data?.list]);
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = roleFilter === "all" || user.userType === roleFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "enabled" ? user.status === 1 : user.status !== 1);
        return matchesRole && matchesStatus;
      }),
    [roleFilter, statusFilter, users],
  );
  const dashboardStats = useMemo(
    () => ({
      totalUsers: users.length,
      adminCount: users.filter((user) => user.userType === "admin").length,
      memberCount: users.filter((user) => user.userType === "member").length,
      enabledCount: users.filter((user) => user.status === 1).length,
    }),
    [users],
  );

  async function handleUpdateUser(
    user: AppUserDto,
    patch: Partial<Pick<AppUserDto, "userType" | "status">>,
  ) {
    try {
      await userUpdateMutation.mutateAsync({
        userId: user.id,
        data: {
          userType: patch.userType,
          status: patch.status,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      messageApi.success("用户信息已更新");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "用户更新失败");
    }
  }

  function handleLogout() {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    navigate("/");
  }

  const columns: ColumnsType<AppUserDto> = [
    {
      title: "用户",
      dataIndex: "username",
      key: "username",
      render: (_, user) => (
        <div className={styles.userIdentity}>
          <strong>{user.nickname}</strong>
          <span>@{user.username}</span>
        </div>
      ),
    },
    {
      title: "角色",
      dataIndex: "userType",
      key: "userType",
      render: (userType, user) => (
        <Select
          className={styles.inlineSelect}
          value={userType}
          options={roleOptions}
          disabled={currentUser?.id === user.id}
          onChange={(nextRole) =>
            void handleUpdateUser(user, {
              userType: nextRole as AppUserDto["userType"],
            })
          }
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status, user) => (
        <div className={styles.statusCell}>
          <Tag color={status === 1 ? "blue" : "default"}>
            {status === 1 ? "启用中" : "已停用"}
          </Tag>
          <Switch
            size="small"
            checked={status === 1}
            disabled={currentUser?.id === user.id}
            onChange={(checked) =>
              void handleUpdateUser(user, {
                status: checked ? 1 : 2,
              })
            }
          />
        </div>
      ),
    },
    {
      title: "联系方式",
      key: "contact",
      render: (_, user) => (
        <div className={styles.contactCell}>
          <span>{user.phone || "未填写手机号"}</span>
          <span>{user.email || "未填写邮箱"}</span>
        </div>
      ),
    },
    {
      title: "最近登录",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => formatDateTime(value),
    },
  ];

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty description="请先登录后再进入后台管理" />
        <Button type="primary" onClick={() => navigate("/")}>
          返回地图工作台
        </Button>
      </main>
    );
  }

  if (currentUserQuery.isLoading) {
    return (
      <main className={styles.stateShell}>
        <Spin size="large" />
        <p>正在校验管理员身份...</p>
      </main>
    );
  }

  if (currentUserQuery.error || currentUser?.userType !== "admin") {
    return (
      <main className={styles.stateShell}>
        <Alert
          type="error"
          showIcon
          message="当前账号无权进入后台管理"
          description="管理员后台仅对 admin 角色开放，请使用管理员账号登录。"
        />
        <Button onClick={() => navigate("/")}>返回地图工作台</Button>
      </main>
    );
  }

  return (
    <main className={styles.consoleShell}>
      {contextHolder}

      <aside className={styles.sideRail}>
        <div className={styles.brandCard}>
          <img src="/header_logo.png" alt="行迹旅图 TrailMap" />
          <span>Admin Console</span>
        </div>

        <div className={styles.sideNav}>
          <button className={styles.sideNavItemActive} type="button">
            <TeamOutlined />
            <span>用户管理</span>
          </button>
          <button className={styles.sideNavItem} type="button" disabled>
            <DashboardOutlined />
            <span>景点运营</span>
            <em>即将开放</em>
          </button>
          <button className={styles.sideNavItem} type="button" disabled>
            <SafetyCertificateOutlined />
            <span>权限日志</span>
            <em>即将开放</em>
          </button>
        </div>

        <div className={styles.sideFooter}>
          <div className={styles.adminBadge}>
            <LockOutlined />
            <div>
              <strong>{currentUser.nickname}</strong>
              <span>管理员已登录</span>
            </div>
          </div>
          <Button block onClick={() => navigate("/")}>
            <ArrowLeftOutlined />
            返回地图
          </Button>
          <Button block danger ghost onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </aside>

      <section className={styles.mainPanel}>
        <header className={styles.heroSection}>
          <div>
            <span className={styles.heroKicker}>后台管理模块</span>
            <h1>用户系统控制台</h1>
            <p>集中管理 TrailMap 当前登录用户、角色和账号状态，为后续收藏、打卡和行程归档能力提供权限基础。</p>
          </div>
          <div className={styles.heroActions}>
            <Button
              icon={<ReloadOutlined />}
              loading={usersQuery.isFetching}
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
              }
            >
              刷新数据
            </Button>
          </div>
        </header>

        <section className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <Statistic title="用户总量" value={dashboardStats.totalUsers} />
          </article>
          <article className={styles.metricCard}>
            <Statistic title="管理员数量" value={dashboardStats.adminCount} />
          </article>
          <article className={styles.metricCard}>
            <Statistic title="会员数量" value={dashboardStats.memberCount} />
          </article>
          <article className={styles.metricCard}>
            <Statistic title="启用账号" value={dashboardStats.enabledCount} />
          </article>
        </section>

        <section className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <strong>用户管理</strong>
              <span>当前优先提供角色切换与账号启停管理。</span>
            </div>

            <div className={styles.toolbar}>
              <Select
                className={styles.toolbarSelect}
                value={roleFilter}
                options={[{ label: "全部角色", value: "all" }, ...roleOptions]}
                onChange={(value) =>
                  setRoleFilter(value as "all" | AppUserDto["userType"])
                }
              />
              <Select
                className={styles.toolbarSelect}
                value={statusFilter}
                options={statusOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                onChange={(value) =>
                  setStatusFilter(value as (typeof statusOptions)[number]["value"])
                }
              />
            </div>
          </div>

          {usersQuery.error ? (
            <Alert
              type="error"
              showIcon
              message="用户列表加载失败"
              description={
                usersQuery.error instanceof Error
                  ? usersQuery.error.message
                  : "暂时无法获取用户数据"
              }
            />
          ) : (
            <Table
              rowKey="id"
              className={styles.userTable}
              loading={usersQuery.isLoading || userUpdateMutation.isPending}
              columns={columns}
              dataSource={filteredUsers}
              pagination={false}
            />
          )}
        </section>

        <section className={styles.quickNotes}>
          <article className={styles.noteCard}>
            <UserSwitchOutlined />
            <div>
              <strong>角色切换</strong>
              <p>普通用户、会员、管理员当前已可通过后台直接切换。</p>
            </div>
          </article>
          <article className={styles.noteCard}>
            <SafetyCertificateOutlined />
            <div>
              <strong>权限边界</strong>
              <p>后台管理接口已由 Spring Security 限制为 admin 角色可访问。</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}
