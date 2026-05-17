import { Alert, Button, Empty, Spin, message } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { AdminTopBar } from "../../components/admin/AdminTopBar";
import type { AdminSection, AdminStatusFilter } from "../../admin/types";
import {
  useAdminCitiesQuery,
  useAdminCityCreateMutation,
  useAdminCityDeleteMutation,
  useAdminCityUpdateMutation,
  useAdminSpotCreateMutation,
  useAdminSpotDeleteMutation,
  useAdminSpotUpdateMutation,
  useAdminSpotsQuery,
  useAdminUsersQuery,
  useAdminUserUpdateMutation,
} from "../../hooks/useAdminData";
import { useCurrentUserQuery } from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import { queryClient } from "../../lib/queryClient";
import type { AdminCityDto, AdminCityFormDto, AdminSpotDto, AdminSpotFormDto } from "../../types/admin";
import type { AppUserDto } from "../../types/auth";
import { AdminOverviewSection } from "./components/AdminOverviewSection";
import { AdminCitiesSection } from "./components/AdminCitiesSection";
import { AdminSpotsSection } from "./components/AdminSpotsSection";
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
  const [editingUser, setEditingUser] = useState<AppUserDto | null>(null);
  const [editingCity, setEditingCity] = useState<AdminCityDto | null>(null);
  const [editingSpot, setEditingSpot] = useState<AdminSpotDto | null>(null);
  const [cityKeyword, setCityKeyword] = useState("");
  const [spotKeyword, setSpotKeyword] = useState("");
  const [spotCityFilter, setSpotCityFilter] = useState<number | undefined>(undefined);
  const [spotTypeFilter, setSpotTypeFilter] = useState<"all" | AdminSpotDto["type"]>("all");
  const [spotStatusFilter, setSpotStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const usersQuery = useAdminUsersQuery(
    1,
    20,
    Boolean(authToken) && currentUserQuery.data?.userType === "admin",
  );
  const citiesQuery = useAdminCitiesQuery(
    1,
    100,
    Boolean(authToken) && currentUserQuery.data?.userType === "admin",
  );
  const spotsQuery = useAdminSpotsQuery(
    1,
    100,
    {
      cityId: spotCityFilter,
      keyword: spotKeyword || undefined,
      type: spotTypeFilter === "all" ? undefined : spotTypeFilter,
      status: spotStatusFilter === "all" ? undefined : spotStatusFilter === "enabled" ? 1 : 0,
    },
    Boolean(authToken) && currentUserQuery.data?.userType === "admin",
  );
  const userUpdateMutation = useAdminUserUpdateMutation();
  const cityCreateMutation = useAdminCityCreateMutation();
  const cityUpdateMutation = useAdminCityUpdateMutation();
  const cityDeleteMutation = useAdminCityDeleteMutation();
  const spotCreateMutation = useAdminSpotCreateMutation();
  const spotUpdateMutation = useAdminSpotUpdateMutation();
  const spotDeleteMutation = useAdminSpotDeleteMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const currentUser = currentUserQuery.data;
  const users = useMemo(() => usersQuery.data?.list ?? [], [usersQuery.data?.list]);
  const cities = useMemo(() => citiesQuery.data?.list ?? [], [citiesQuery.data?.list]);
  const spots = useMemo(() => spotsQuery.data?.list ?? [], [spotsQuery.data?.list]);
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

  // 统一更新用户资料、角色与状态，避免页面和表格各自散写 mutation。
  async function handleUpdateUser(
    user: AppUserDto,
    patch: {
      nickname?: string;
      userType?: AppUserDto["userType"];
      avatarUrl?: string | null;
      phone?: string | null;
      email?: string | null;
      status?: number;
    },
  ) {
    try {
      await userUpdateMutation.mutateAsync({
        userId: user.id,
        data: {
          nickname: patch.nickname,
          userType: patch.userType,
          avatarUrl: patch.avatarUrl,
          phone: patch.phone,
          email: patch.email,
          status: patch.status,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setEditingUser(null);
      messageApi.success("用户信息已更新");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "用户更新失败");
    }
  }

  // 管理端城市新增、编辑共用同一套成功提示和缓存刷新逻辑。
  async function handleSubmitCity(payload: Partial<AdminCityFormDto>, cityId?: number) {
    try {
      if (cityId) {
        await cityUpdateMutation.mutateAsync({ cityId, data: payload });
      } else {
        await cityCreateMutation.mutateAsync(payload as AdminCityFormDto);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "cities"] });
      await queryClient.invalidateQueries({ queryKey: ["cities"] });
      setEditingCity(null);
      messageApi.success(cityId ? "城市信息已更新" : "城市已创建");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "城市操作失败");
    }
  }

  async function handleDeleteCity(cityId: number) {
    try {
      await cityDeleteMutation.mutateAsync(cityId);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cities"] });
      await queryClient.invalidateQueries({ queryKey: ["cities"] });
      messageApi.success("城市已删除");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "城市删除失败");
    }
  }

  // 管理端景点新增、编辑共用提交逻辑，避免页面层散落字段转换。
  async function handleSubmitSpot(payload: Partial<AdminSpotFormDto>, spotId?: number) {
    try {
      if (spotId) {
        await spotUpdateMutation.mutateAsync({ spotId, data: payload });
      } else {
        await spotCreateMutation.mutateAsync(payload as AdminSpotFormDto);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "spots"] });
      await queryClient.invalidateQueries({ queryKey: ["spots"] });
      setEditingSpot(null);
      messageApi.success(spotId ? "景点信息已更新" : "景点已创建");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "景点操作失败");
    }
  }

  async function handleDeleteSpot(spotId: number) {
    try {
      await spotDeleteMutation.mutateAsync(spotId);
      await queryClient.invalidateQueries({ queryKey: ["admin", "spots"] });
      await queryClient.invalidateQueries({ queryKey: ["spots"] });
      messageApi.success("景点已删除");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "景点删除失败");
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
          description="管理员后台仅对管理员角色开放，请使用管理员账号登录。"
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
          isRefreshing={usersQuery.isFetching || citiesQuery.isFetching || spotsQuery.isFetching}
          searchKeyword={searchKeyword}
          onRefresh={() =>
            void Promise.all([
              queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
              queryClient.invalidateQueries({ queryKey: ["admin", "cities"] }),
              queryClient.invalidateQueries({ queryKey: ["admin", "spots"] }),
            ])
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
        ) : activeSection === "users" ? (
          <AdminUsersSection
            currentUserId={currentAdmin.id}
            editingUser={editingUser}
            filteredUsers={filteredUsers}
            isLoading={usersQuery.isLoading}
            isUpdating={userUpdateMutation.isPending}
            roleFilter={roleFilter}
            searchKeyword={searchKeyword}
            statusFilter={statusFilter}
            tableError={usersQuery.error instanceof Error ? usersQuery.error : null}
            onCloseEditModal={() => setEditingUser(null)}
            onOpenEditModal={setEditingUser}
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
            onSubmitEdit={(user, payload) => void handleUpdateUser(user, payload)}
          />
        ) : activeSection === "cities" ? (
          <AdminCitiesSection
            cities={cities}
            editingCity={editingCity}
            isLoading={citiesQuery.isLoading}
            isSubmitting={cityCreateMutation.isPending || cityUpdateMutation.isPending || cityDeleteMutation.isPending}
            keyword={cityKeyword}
            tableError={citiesQuery.error instanceof Error ? citiesQuery.error : null}
            onCloseEditModal={() => setEditingCity(null)}
            onDeleteCity={(city) => void handleDeleteCity(city.id)}
            onOpenCreateModal={() =>
              setEditingCity({
                id: 0,
                name: "",
                provinceName: "",
                cityCode: "",
                center: { lng: 0, lat: 0 },
                mapZoom: 11,
                coverUrl: "",
                description: "",
                recommendDays: 3,
                hotScore: 0,
                sortOrder: 0,
                status: 1,
              })
            }
            onOpenEditModal={setEditingCity}
            onSearchChange={setCityKeyword}
            onSubmitCreate={(payload) => void handleSubmitCity(payload)}
            onSubmitEdit={(city, payload) => void handleSubmitCity(payload, city.id)}
          />
        ) : (
          <AdminSpotsSection
            cities={cities}
            editingSpot={editingSpot}
            isLoading={spotsQuery.isLoading}
            isSubmitting={spotCreateMutation.isPending || spotUpdateMutation.isPending || spotDeleteMutation.isPending}
            keyword={spotKeyword}
            selectedCityId={spotCityFilter}
            selectedStatus={spotStatusFilter}
            selectedType={spotTypeFilter}
            spots={spots}
            tableError={spotsQuery.error instanceof Error ? spotsQuery.error : null}
            onCityFilterChange={setSpotCityFilter}
            onCloseEditModal={() => setEditingSpot(null)}
            onDeleteSpot={(spot) => void handleDeleteSpot(spot.id)}
            onKeywordChange={setSpotKeyword}
            onOpenCreateModal={() =>
              setEditingSpot({
                id: 0,
                cityId: cities[0]?.id ?? 0,
                cityName: cities[0]?.name ?? "",
                name: "",
                type: "history",
                position: { lng: 0, lat: 0 },
                address: "",
                amapPoiId: "",
                boundaryGeojson: "",
                coverUrl: "",
                summary: "",
                description: "",
                recommendReason: "",
                travelGuide: "",
                openingHours: "",
                ticketInfo: "",
                suggestedDurationMinutes: 120,
                bestTime: "",
                recommendScore: 4.5,
                hotScore: 0,
                suitableCrowd: "",
                free: false,
                indoor: false,
                night: false,
                rainyDay: false,
                subwayFriendly: false,
                firstVisit: false,
                sortOrder: 0,
                status: 1,
                createdAt: "",
                updatedAt: "",
              })
            }
            onOpenEditModal={setEditingSpot}
            onStatusFilterChange={setSpotStatusFilter}
            onSubmitCreate={(payload) => void handleSubmitSpot(payload)}
            onSubmitEdit={(spot, payload) => void handleSubmitSpot(payload, spot.id)}
            onTypeFilterChange={setSpotTypeFilter}
          />
        )}
      </section>
    </main>
  );
}
