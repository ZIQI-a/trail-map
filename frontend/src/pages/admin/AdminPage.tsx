import { Alert, Button, Empty, Spin, message } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { AdminTopBar } from "../../components/admin/AdminTopBar";
import type { AdminSection, AdminStatusFilter } from "../../admin/types";
import { useAdminUsersQuery, useAdminUserUpdateMutation } from "../../hooks/useAdminData";
import { useCurrentUserQuery } from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import { queryClient } from "../../lib/queryClient";
import type { AppUserDto } from "../../types/auth";
import { AdminOverviewSection } from "./components/AdminOverviewSection";
import { AdminUsersSection } from "./components/AdminUsersSection";
import styles from "./AdminPage.module.css";

// AdminPage 是后台模块入口，仅负责鉴权、状态编排与页面切换。
export function AdminPage() {
  const navigate = useNavigate();
  const authToken = getAuthToken();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppUserDto["userType"]>("all");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");
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

  // 统一更新用户状态与角色，避免页面和表格各自散写 mutation。
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

  // 退出登录时同时清理认证态缓存，防止后台页残留旧身份信息。
  function handleLogout() {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    navigate("/");
  }

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

  const currentAdmin = currentUser;

  return (
    <main className={styles.consoleShell}>
      {contextHolder}

      <AdminSidebar
        activeSection={activeSection}
        currentUser={currentAdmin}
        onBack={() => navigate("/")}
        onChangeSection={setActiveSection}
        onLogout={handleLogout}
      />

      <section className={styles.workspace}>
        <AdminTopBar
          activeSection={activeSection}
          currentUser={currentAdmin}
          isRefreshing={usersQuery.isFetching}
          searchKeyword={searchKeyword}
          onRefresh={() =>
            void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
          }
          onSearchChange={setSearchKeyword}
        />

        {activeSection === "overview" ? (
          <AdminOverviewSection
            overviewStats={overviewStats}
            recentUsers={recentUsers}
            statusSummary={statusSummary}
            onOpenUsers={() => setActiveSection("users")}
          />
        ) : (
          <AdminUsersSection
            currentUserId={currentAdmin.id}
            filteredUsers={filteredUsers}
            isLoading={usersQuery.isLoading}
            isUpdating={userUpdateMutation.isPending}
            overviewStats={{
              totalUsers: overviewStats.totalUsers,
              enabledUsers: overviewStats.enabledUsers,
            }}
            roleFilter={roleFilter}
            searchKeyword={searchKeyword}
            statusFilter={statusFilter}
            tableError={usersQuery.error instanceof Error ? usersQuery.error : null}
            users={users}
            onResetFilters={() => {
              setSearchKeyword("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
            onRoleFilterChange={setRoleFilter}
            onSearchChange={setSearchKeyword}
            onStatusFilterChange={setStatusFilter}
            onToggleStatus={(user) =>
              void handleUpdateUser(user, {
                status: user.status === 1 ? 2 : 1,
              })
            }
            onUpdateRole={(user, nextRole) =>
              void handleUpdateUser(user, {
                userType: nextRole,
              })
            }
          />
        )}
      </section>
    </main>
  );
}
