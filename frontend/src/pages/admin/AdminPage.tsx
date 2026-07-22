import { Grid, Spin, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { AdminTopBar } from "../../components/admin/AdminTopBar";
import type { AdminSection, AdminStatusFilter } from "../../admin/types";
import {
  useAdminCitiesQuery,
  useAdminCityCreateMutation,
  useAdminCityDeleteMutation,
  useAdminCityUpdateMutation,
  useAdminOverviewQuery,
  useAdminSpotCreateMutation,
  useAdminSpotDeleteMutation,
  useAdminSpotUpdateMutation,
  useAdminSpotsQuery,
  useAdminUsersQuery,
  useAdminUserUpdateMutation,
} from "../../hooks/useAdminData";
import { useCurrentUserQuery } from "../../hooks/useMapWorkbenchData";
import { useAuthToken } from "../../hooks/useAuthToken";
import { clearAuthToken } from "../../lib/authToken";
import { queryClient } from "../../lib/queryClient";
import type { AdminCityDto, AdminCityFormDto, AdminSpotDto, AdminSpotFormDto } from "../../types/admin";
import type { AppUserDto } from "../../types/auth";
import { NotFoundPage } from "../not-found";
import { AdminOverviewSection } from "./components/AdminOverviewSection";
import { AdminCitiesSection } from "./components/AdminCitiesSection";
import { AdminSpotsSection } from "./components/AdminSpotsSection";
import { AdminUsersSection } from "./components/AdminUsersSection";
import styles from "./AdminPage.module.css";

// AdminPage 是后台模块入口，仅负责鉴权、状态编排与页面切换。
export function AdminPage() {
  const navigate = useNavigate();
  const authToken = useAuthToken();
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
  const [userPageNum, setUserPageNum] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [cityPageNum, setCityPageNum] = useState(1);
  const [cityPageSize, setCityPageSize] = useState(10);
  const [spotPageNum, setSpotPageNum] = useState(1);
  const [spotPageSize, setSpotPageSize] = useState(10);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const screens = Grid.useBreakpoint();
  const lastLargeScreenRef = useRef<boolean | undefined>(undefined);
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const adminDataEnabled = Boolean(authToken) && currentUserQuery.data?.userType === "admin";
  const overviewQuery = useAdminOverviewQuery(adminDataEnabled);
  const usersQueryEnabled = adminDataEnabled && activeSection === "users";
  const citiesQueryEnabled = adminDataEnabled && (activeSection === "cities" || activeSection === "spots");
  const spotsQueryEnabled = adminDataEnabled && activeSection === "spots";
  const usersQuery = useAdminUsersQuery(
    userPageNum,
    userPageSize,
    {
      keyword: searchKeyword || undefined,
      userType: roleFilter === "all" ? undefined : roleFilter,
      status: statusFilter === "all" ? undefined : statusFilter === "enabled" ? 1 : 2,
    },
    usersQueryEnabled,
  );
  const citiesQuery = useAdminCitiesQuery(
    cityPageNum,
    cityPageSize,
    {
      keyword: cityKeyword || undefined,
    },
    citiesQueryEnabled,
  );
  const spotsQuery = useAdminSpotsQuery(
    spotPageNum,
    spotPageSize,
    {
      cityId: spotCityFilter,
      keyword: spotKeyword || undefined,
      type: spotTypeFilter === "all" ? undefined : spotTypeFilter,
      status: spotStatusFilter === "all" ? undefined : spotStatusFilter === "enabled" ? 1 : 0,
    },
    spotsQueryEnabled,
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
  const activeSearchKeyword =
    activeSection === "users"
      ? searchKeyword
      : activeSection === "cities"
        ? cityKeyword
        : activeSection === "spots"
          ? spotKeyword
          : "";
  // 屏幕较小时自动收起侧边栏，保证右侧主内容区域的可用宽度。
  useEffect(() => {
    if (lastLargeScreenRef.current === screens.lg) {
      return;
    }
    lastLargeScreenRef.current = screens.lg;
    setSidebarCollapsed(!screens.lg);
  }, [screens.lg]);

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
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
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
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
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
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      await queryClient.invalidateQueries({ queryKey: ["cities"] });
      messageApi.success("城市已删除");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "城市删除失败");
    }
  }

  async function handleToggleCityStatus(city: AdminCityDto) {
    await handleSubmitCity(
      {
        status: city.status === 1 ? 0 : 1,
      },
      city.id,
    );
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
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
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
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      await queryClient.invalidateQueries({ queryKey: ["spots"] });
      messageApi.success("景点已删除");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "景点删除失败");
    }
  }

  async function handleToggleSpotStatus(spot: AdminSpotDto) {
    await handleSubmitSpot(
      {
        status: spot.status === 1 ? 0 : 1,
      },
      spot.id,
    );
  }

  // 退出登录时同时清理认证态缓存，防止后台页残留旧身份信息。
  function handleLogout() {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    navigate("/");
  }

  // 顶部刷新只刷新当前模块相关数据，避免概览页触发无关列表请求。
  function handleRefreshCurrentSection() {
    if (activeSection === "overview") {
      return void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    }
    if (activeSection === "users") {
      return void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
      ]);
    }
    if (activeSection === "cities") {
      return void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "cities"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
      ]);
    }
    return void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "cities"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "spots"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
    ]);
  }

  if (!authToken) {
    return <NotFoundPage />;
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
    return <NotFoundPage />;
  }

  const currentAdmin = currentUser;

  return (
    <main
      className={
        sidebarCollapsed
          ? `${styles.consoleShell} ${styles.consoleShellCollapsed}`
          : styles.consoleShell
      }
    >
      {contextHolder}

      <AdminSidebar
        activeSection={activeSection}
        collapsed={sidebarCollapsed}
        onChangeSection={setActiveSection}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />

      <section className={styles.workspace}>
        <AdminTopBar
          activeSection={activeSection}
          currentUser={currentAdmin}
          isRefreshing={overviewQuery.isFetching || usersQuery.isFetching || citiesQuery.isFetching || spotsQuery.isFetching}
          searchKeyword={activeSearchKeyword}
          onLogout={handleLogout}
          onRefresh={handleRefreshCurrentSection}
          onSearchChange={(value) => {
            if (activeSection === "users") {
              setSearchKeyword(value);
              setUserPageNum(1);
              return;
            }
            if (activeSection === "cities") {
              setCityKeyword(value);
              setCityPageNum(1);
              return;
            }
            if (activeSection === "spots") {
              setSpotKeyword(value);
              setSpotPageNum(1);
            }
          }}
        />

        {activeSection === "overview" ? (
          <AdminOverviewSection
            overview={overviewQuery.data}
            isLoading={overviewQuery.isLoading}
            overviewError={overviewQuery.error instanceof Error ? overviewQuery.error : null}
            onOpenCities={() => setActiveSection("cities")}
            onOpenSpots={() => setActiveSection("spots")}
            onOpenUsers={() => setActiveSection("users")}
          />
        ) : activeSection === "users" ? (
          <AdminUsersSection
            currentUserId={currentAdmin.id}
            editingUser={editingUser}
            isLoading={usersQuery.isLoading}
            isUpdating={userUpdateMutation.isPending}
            pageNum={usersQuery.data?.pageNum ?? userPageNum}
            pageSize={usersQuery.data?.pageSize ?? userPageSize}
            roleFilter={roleFilter}
            searchKeyword={searchKeyword}
            statusFilter={statusFilter}
            tableError={usersQuery.error instanceof Error ? usersQuery.error : null}
            total={usersQuery.data?.total ?? 0}
            users={users}
            onCloseEditModal={() => setEditingUser(null)}
            onOpenEditModal={setEditingUser}
            onResetFilters={() => {
              setSearchKeyword("");
              setRoleFilter("all");
              setStatusFilter("all");
              setUserPageNum(1);
            }}
            onPageChange={(nextPageNum, nextPageSize) => {
              setUserPageNum(nextPageNum);
              setUserPageSize(nextPageSize);
            }}
            onRoleFilterChange={(value) => {
              setRoleFilter(value);
              setUserPageNum(1);
            }}
            onSearchChange={(value) => {
              setSearchKeyword(value);
              setUserPageNum(1);
            }}
            onStatusFilterChange={(value) => {
              setStatusFilter(value);
              setUserPageNum(1);
            }}
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
            pageNum={citiesQuery.data?.pageNum ?? cityPageNum}
            pageSize={citiesQuery.data?.pageSize ?? cityPageSize}
            tableError={citiesQuery.error instanceof Error ? citiesQuery.error : null}
            total={citiesQuery.data?.total ?? 0}
            onCloseEditModal={() => setEditingCity(null)}
            onDeleteCity={(city) => void handleDeleteCity(city.id)}
            onPageChange={(nextPageNum, nextPageSize) => {
              setCityPageNum(nextPageNum);
              setCityPageSize(nextPageSize);
            }}
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
            onSearchChange={(value) => {
              setCityKeyword(value);
              setCityPageNum(1);
            }}
            onToggleStatus={(city) => void handleToggleCityStatus(city)}
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
            pageNum={spotsQuery.data?.pageNum ?? spotPageNum}
            pageSize={spotsQuery.data?.pageSize ?? spotPageSize}
            selectedCityId={spotCityFilter}
            selectedStatus={spotStatusFilter}
            selectedType={spotTypeFilter}
            spots={spots}
            tableError={spotsQuery.error instanceof Error ? spotsQuery.error : null}
            total={spotsQuery.data?.total ?? 0}
            onCityFilterChange={(value) => {
              setSpotCityFilter(value);
              setSpotPageNum(1);
            }}
            onCloseEditModal={() => setEditingSpot(null)}
            onDeleteSpot={(spot) => void handleDeleteSpot(spot.id)}
            onKeywordChange={(value) => {
              setSpotKeyword(value);
              setSpotPageNum(1);
            }}
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
            onPageChange={(nextPageNum, nextPageSize) => {
              setSpotPageNum(nextPageNum);
              setSpotPageSize(nextPageSize);
            }}
            onStatusFilterChange={(value) => {
              setSpotStatusFilter(value);
              setSpotPageNum(1);
            }}
            onToggleStatus={(spot) => void handleToggleSpotStatus(spot)}
            onSubmitCreate={(payload) => void handleSubmitSpot(payload)}
            onSubmitEdit={(spot, payload) => void handleSubmitSpot(payload, spot.id)}
            onTypeFilterChange={(value) => {
              setSpotTypeFilter(value);
              setSpotPageNum(1);
            }}
          />
        )}
      </section>
    </main>
  );
}
