import {
  AlertOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminUsersQuery, useAdminUserUpdateMutation } from "../../hooks/useAdminData";
import { useCurrentUserQuery } from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import { queryClient } from "../../lib/queryClient";
import type { AppUserDto } from "../../types/auth";
import styles from "./AdminConsolePage.module.css";

type AdminSection = "overview" | "users";

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

const adminNavItems = [
  { key: "overview", label: "数据概览", icon: <BarChartOutlined /> },
  { key: "users", label: "用户管理", icon: <TeamOutlined /> },
  { key: "settings", label: "系统设置", icon: <SettingOutlined />, disabled: true },
] satisfies Array<{
  key: AdminSection | "settings";
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}>;

// AdminConsolePage 是管理员后台独立模块，当前先聚焦数据概览和用户管理。
export function AdminConsolePage() {
  const navigate = useNavigate();
  const authToken = getAuthToken();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [searchKeyword, setSearchKeyword] = useState("");
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
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? users[0],
    [selectedUserId, users],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const keyword = searchKeyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          user.username.toLowerCase().includes(keyword) ||
          user.nickname.toLowerCase().includes(keyword) ||
          (user.phone ?? "").includes(keyword) ||
          (user.email ?? "").toLowerCase().includes(keyword);
        const matchesRole = roleFilter === "all" || user.userType === roleFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "enabled" ? user.status === 1 : user.status !== 1);
        return matchesKeyword && matchesRole && matchesStatus;
      }),
    [roleFilter, searchKeyword, statusFilter, users],
  );
  const overviewStats = useMemo(
    () => ({
      totalUsers: users.length,
      enabledUsers: users.filter((user) => user.status === 1).length,
      adminUsers: users.filter((user) => user.userType === "admin").length,
      memberUsers: users.filter((user) => user.userType === "member").length,
    }),
    [users],
  );
  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((left, right) =>
          (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
        )
        .slice(0, 5),
    [users],
  );
  const statusSummary = useMemo(
    () => [
      {
        label: "待关注账号",
        description: "已停用或长期未登录用户",
        value: users.filter((user) => user.status !== 1).length,
      },
      {
        label: "管理员账号",
        description: "当前具备后台访问权限的用户",
        value: overviewStats.adminUsers,
      },
      {
        label: "活跃注册",
        description: "最近登录时间不为空的用户",
        value: users.filter((user) => Boolean(user.lastLoginAt)).length,
      },
    ],
    [overviewStats.adminUsers, users],
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
        <button
          className={styles.userLink}
          type="button"
          onClick={() => setSelectedUserId(user.id)}
        >
          <Avatar
            size={36}
            src={user.avatarUrl || undefined}
            icon={<UserOutlined />}
          />
          <div className={styles.userIdentity}>
            <strong>{user.nickname}</strong>
            <span>@{user.username}</span>
          </div>
        </button>
      ),
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
      render: (value) => value || "--",
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
      title: "账号状态",
      dataIndex: "status",
      key: "status",
      render: (status, user) => (
        <div className={styles.statusCell}>
          <Tag color={status === 1 ? "success" : "error"}>
            {status === 1 ? "正常" : "停用"}
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
      title: "注册时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: "最近登录",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: "操作",
      key: "action",
      render: (_, user) => (
        <div className={styles.tableActions}>
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setSelectedUserId(user.id)}
          >
            查看
          </Button>
        </div>
      ),
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
        <div className={styles.brandArea}>
          <img src="/header_logo.png" alt="行迹旅图 TrailMap" />
          <span>TrailMap Admin</span>
        </div>

        <nav className={styles.sideMenu}>
          {adminNavItems.map((item) => {
            const itemKey = item.key as AdminSection | "settings";
            const active = itemKey === activeSection;
            return (
              <button
                className={active ? styles.sideMenuItemActive : styles.sideMenuItem}
                type="button"
                key={item.key}
                disabled={Boolean(item.disabled)}
                onClick={() => {
                  if (itemKey === "overview" || itemKey === "users") {
                    setActiveSection(itemKey);
                  }
                }}
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
              <span>超级管理员</span>
            </div>
          </div>

          <Button block icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
            返回地图
          </Button>
          <Button block danger ghost icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topBar}>
          <div className={styles.pagePath}>
            <AppstoreOutlined />
            <span>首页</span>
            <em>/</em>
            <strong>{activeSection === "overview" ? "数据概览" : "用户管理"}</strong>
          </div>

          <div className={styles.topBarActions}>
            <Input
              className={styles.searchInput}
              prefix={<SearchOutlined />}
              placeholder="搜索城市、景点、用户、行程等..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
            <Button className={styles.iconButton} icon={<BellOutlined />} />
            <Button
              className={styles.iconButton}
              icon={<ReloadOutlined />}
              loading={usersQuery.isFetching}
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
              }
            />
          </div>
        </header>

        {activeSection === "overview" ? (
          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <div className={styles.pageHeading}>
                <h1>数据概览</h1>
                <p>欢迎回来，管理员。以下是当前平台用户域和后台权限相关的最新概况。</p>
              </div>

              <div className={styles.statGrid}>
                <Card className={styles.statCard}>
                  <Statistic title="用户总数" value={overviewStats.totalUsers} prefix={<TeamOutlined />} />
                  <span className={styles.cardTrend}>较昨日 +12</span>
                </Card>
                <Card className={styles.statCard}>
                  <Statistic title="启用账号" value={overviewStats.enabledUsers} prefix={<CheckCircleOutlined />} />
                  <span className={styles.cardTrend}>活跃率稳定</span>
                </Card>
                <Card className={styles.statCard}>
                  <Statistic title="管理员账号" value={overviewStats.adminUsers} prefix={<LockOutlined />} />
                  <span className={styles.cardTrend}>权限已接入 Security</span>
                </Card>
                <Card className={styles.statCard}>
                  <Statistic title="会员用户" value={overviewStats.memberUsers} prefix={<RiseOutlined />} />
                  <span className={styles.cardTrend}>待拓展会员能力</span>
                </Card>
              </div>

              <div className={styles.dualSection}>
                <Card
                  className={styles.panelCard}
                  title="待处理事项"
                  extra={<Button type="link">查看全部</Button>}
                >
                  <div className={styles.todoList}>
                    {statusSummary.map((item) => (
                      <div className={styles.todoItem} key={item.label}>
                        <span className={styles.todoIcon}>
                          <AlertOutlined />
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.description}</p>
                        </div>
                        <em>{item.value}</em>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card
                  className={styles.panelCard}
                  title="最近注册用户"
                  extra={<Button type="link" onClick={() => setActiveSection("users")}>进入用户管理</Button>}
                >
                  <div className={styles.recentList}>
                    {recentUsers.map((user) => (
                      <button
                        className={styles.recentUser}
                        type="button"
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setActiveSection("users");
                        }}
                      >
                        <Avatar size={42} src={user.avatarUrl || undefined} icon={<UserOutlined />} />
                        <div>
                          <strong>{user.nickname}</strong>
                          <span>{formatDateTime(user.createdAt)}</span>
                        </div>
                        <Tag color={user.status === 1 ? "success" : "error"}>
                          {user.status === 1 ? "正常" : "停用"}
                        </Tag>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <aside className={styles.detailColumn}>
              <Card className={styles.profileCard} title="管理员信息">
                <div className={styles.profileHero}>
                  <Avatar
                    size={68}
                    src={currentUser.avatarUrl || undefined}
                    icon={<LockOutlined />}
                  />
                  <div>
                    <strong>{currentUser.nickname}</strong>
                    <span>@{currentUser.username}</span>
                    <Tag color="blue">ADMIN</Tag>
                  </div>
                </div>

                <div className={styles.profileMeta}>
                  <div><MailOutlined /><span>{currentUser.email || "未填写邮箱"}</span></div>
                  <div><PhoneOutlined /><span>{currentUser.phone || "未填写手机号"}</span></div>
                  <div><CalendarOutlined /><span>{formatDateTime(currentUser.lastLoginAt)}</span></div>
                </div>
              </Card>
            </aside>
          </section>
        ) : (
          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <div className={styles.pageHeading}>
                <h1>用户管理</h1>
                <p>统一查看注册用户、角色类型、账号状态与最近登录情况。</p>
              </div>

              <div className={styles.filterBar}>
                <Input
                  className={styles.filterInput}
                  prefix={<SearchOutlined />}
                  placeholder="昵称 / 用户名 / 手机号 / 邮箱"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                />
                <Select
                  className={styles.filterSelect}
                  value={roleFilter}
                  options={[{ label: "全部角色", value: "all" }, ...roleOptions]}
                  onChange={(value) => setRoleFilter(value as "all" | AppUserDto["userType"])}
                />
                <Select
                  className={styles.filterSelect}
                  value={statusFilter}
                  options={statusOptions.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  onChange={(value) =>
                    setStatusFilter(value as (typeof statusOptions)[number]["value"])
                  }
                />
                <Button onClick={() => {
                  setSearchKeyword("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}>
                  重置
                </Button>
              </div>

              <div className={styles.statGrid}>
                <Card className={styles.statCard}>
                  <Statistic title="用户总数" value={overviewStats.totalUsers} prefix={<TeamOutlined />} />
                </Card>
                <Card className={styles.statCard}>
                  <Statistic title="今日活跃" value={users.filter((user) => Boolean(user.lastLoginAt)).length} prefix={<RiseOutlined />} />
                </Card>
                <Card className={styles.statCard}>
                  <Statistic title="正常账号" value={overviewStats.enabledUsers} prefix={<CheckCircleOutlined />} />
                </Card>
                <Card className={styles.statCard}>
                  <Statistic title="已停用" value={users.filter((user) => user.status !== 1).length} prefix={<AlertOutlined />} />
                </Card>
              </div>

              <Card className={styles.tableCard} bodyStyle={{ padding: 0 }}>
                {usersQuery.error ? (
                  <div className={styles.tableState}>
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
                  </div>
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
              </Card>
            </div>

            <aside className={styles.detailColumn}>
              <Card
                className={styles.profileCard}
                title="用户详情"
                extra={selectedUser ? <Tag color={selectedUser.status === 1 ? "success" : "error"}>{selectedUser.status === 1 ? "正常" : "停用"}</Tag> : null}
              >
                {selectedUser ? (
                  <>
                    <div className={styles.profileHero}>
                      <Avatar
                        size={72}
                        src={selectedUser.avatarUrl || undefined}
                        icon={<UserOutlined />}
                      />
                      <div>
                        <strong>{selectedUser.nickname}</strong>
                        <span>@{selectedUser.username}</span>
                        <Tag color={selectedUser.userType === "admin" ? "blue" : selectedUser.userType === "member" ? "purple" : "default"}>
                          {selectedUser.userType.toUpperCase()}
                        </Tag>
                      </div>
                    </div>

                    <div className={styles.profileMeta}>
                      <div><PhoneOutlined /><span>{selectedUser.phone || "未填写手机号"}</span></div>
                      <div><MailOutlined /><span>{selectedUser.email || "未填写邮箱"}</span></div>
                      <div><CalendarOutlined /><span>注册时间：{formatDateTime(selectedUser.createdAt)}</span></div>
                      <div><CalendarOutlined /><span>最近登录：{formatDateTime(selectedUser.lastLoginAt)}</span></div>
                    </div>

                    <div className={styles.profileActions}>
                      <Button
                        type="primary"
                        block
                        onClick={() =>
                          void handleUpdateUser(selectedUser, {
                            status: selectedUser.status === 1 ? 2 : 1,
                          })
                        }
                      >
                        {selectedUser.status === 1 ? "停用账号" : "启用账号"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Empty description="请选择用户查看详情" />
                )}
              </Card>
            </aside>
          </section>
        )}
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
