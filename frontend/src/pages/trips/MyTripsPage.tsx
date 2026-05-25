import {
  AppstoreOutlined,
  CalendarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  ShareAltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Pagination,
  Popconfirm,
  Segmented,
  Select,
  Spin,
  Switch,
  Tag,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PersonalPageLayout } from "../../components/personal";
import {
  useCitiesQuery,
  useCurrentUserQuery,
  useDeleteUserTripMutation,
  useUpdateUserTripShareMutation,
  useUserTripsQuery,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import type { UserTripSummaryDto } from "../../types/mapWorkbench";
import {
  formatRouteDistance,
  formatTripDuration,
} from "../../utils/map-workbench/routeDisplay";
import styles from "./MyTripsPage.module.css";

type TripScope = "all" | "schedule" | "free";
type TripViewMode = "grid" | "list";
type TripSortMode = "latest" | "city";

const EMPTY_TRIPS: UserTripSummaryDto[] = [];

// MyTripsPage 负责承接“我的旅行规划”列表、详情和删除管理。
export function MyTripsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [scope, setScope] = useState<TripScope>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<TripSortMode>("latest");
  const [viewMode, setViewMode] = useState<TripViewMode>("list");

  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const citiesQuery = useCitiesQuery();
  const userTripsQuery = useUserTripsQuery(
    { pageNum, pageSize: 200 }, // 目前先拉取较多数据在前端过滤，后续可由后端支持
    Boolean(authToken),
  );
  const deleteUserTripMutation = useDeleteUserTripMutation();
  const updateUserTripShareMutation = useUpdateUserTripShareMutation();
  const allTrips = userTripsQuery.data?.list ?? EMPTY_TRIPS;

  const cityOptions = useMemo(
    () => [
      { label: "全部城市", value: "all" },
      ...(citiesQuery.data?.list ?? []).map((city) => ({
        label: city.name,
        value: city.name,
      })),
    ],
    [citiesQuery.data?.list],
  );

  const filteredTrips = useMemo(() => {
    const scopedTrips = allTrips.filter((trip) => {
      if (scope !== "all" && trip.planMode !== scope) {
        return false;
      }
      if (cityFilter !== "all" && trip.cityName !== cityFilter) {
        return false;
      }
      return true;
    });

    return [...scopedTrips].sort((left, right) => {
      if (sortMode === "city") {
        return left.cityName.localeCompare(right.cityName, "zh-CN");
      }
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [allTrips, cityFilter, scope, sortMode]);

  const pagedTrips = useMemo(() => {
    const startIndex = (pageNum - 1) * pageSize;
    return filteredTrips.slice(startIndex, startIndex + pageSize);
  }, [filteredTrips, pageNum, pageSize]);

  function handleLogout() {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    queryClient.removeQueries({ queryKey: ["favorite-spots"] });
    queryClient.removeQueries({ queryKey: ["user-trips"] });
    navigate("/");
  }

  async function handleDeleteTrip(tripId: number) {
    await deleteUserTripMutation.mutateAsync(tripId);
    message.success("规划已删除");
    await queryClient.invalidateQueries({ queryKey: ["user-trips"] });
  }

  /**
   * 切换行程公开分享状态；开启后生成 shareToken，关闭后外部链接立即失效。
   */
  async function handleToggleTripShare(tripId: number, enabled: boolean) {
    const result = await updateUserTripShareMutation.mutateAsync({
      enabled,
      tripId,
    });
    message.success(enabled ? "已开启公开分享" : "已关闭公开分享");
    await queryClient.invalidateQueries({ queryKey: ["user-trips"] });
    return result;
  }

  /**
   * 复制当前行程公开分享链接；未开启公开分享时先提示用户开启。
   */
  async function handleCopyShareLink(shareToken?: string | null) {
    if (!shareToken) {
      message.warning("请先开启公开分享");
      return;
    }

    const shareLink = buildTripShareLink(shareToken);
    await navigator.clipboard.writeText(shareLink);
    message.success("分享链接已复制");
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty
          description="登录后即可查看你保存的旅行规划"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Button type="primary" onClick={() => navigate("/")}>
          返回首页登录
        </Button>
      </main>
    );
  }

  if (currentUserQuery.isLoading) {
    return (
      <main className={styles.stateShell}>
        <Spin size="large" />
        <p>正在加载你的规划信息...</p>
      </main>
    );
  }

  if (currentUserQuery.error || !currentUserQuery.data) {
    return (
      <main className={styles.stateShell}>
        <Alert
          type="error"
          showIcon
          message="规划页暂时无法访问"
          description="请重新登录后再试。"
        />
        <Button onClick={() => navigate("/")}>返回首页</Button>
      </main>
    );
  }

  return (
    <PersonalPageLayout
      currentUser={currentUserQuery.data}
      title="我的行程"
      description="规划每一次出发，记录每一段旅程✨"
      onLogout={handleLogout}
    >
      <section className={styles.toolbar}>
        <Segmented
          size="large"
          className={styles.scopeSwitch}
          value={scope}
          options={[
            { label: "全部行程", value: "all" },
            { label: "完整行程", value: "schedule" },
            { label: "自由路线", value: "free" },
          ]}
          onChange={(value) => {
            setScope(value as TripScope);
            setPageNum(1);
          }}
        />

        <div className={styles.toolbarFilters}>
          <Select
            size="large"
            value={cityFilter}
            options={cityOptions}
            onChange={(value) => {
              setCityFilter(value);
              setPageNum(1);
            }}
          />
          <Select
            size="large"
            value={sortMode}
            options={[
              { label: "创建时间", value: "latest" },
              { label: "城市名称", value: "city" },
            ]}
            onChange={(value) => {
              setSortMode(value as TripSortMode);
              setPageNum(1);
            }}
          />
          <Segmented
            size="large"
            className={styles.viewSwitch}
            value={viewMode}
            options={[
              { label: <UnorderedListOutlined />, value: "list" },
              { label: <AppstoreOutlined />, value: "grid" },
            ]}
            onChange={(value) => setViewMode(value as TripViewMode)}
          />
        </div>
      </section>

      {userTripsQuery.error ? (
        <section className={styles.feedbackCard}>
          <Alert
            type="error"
            showIcon
            message="规划列表加载失败"
            description={
              userTripsQuery.error instanceof Error
                ? userTripsQuery.error.message
                : "暂时无法获取你的规划数据"
            }
          />
        </section>
      ) : userTripsQuery.isLoading && !userTripsQuery.data ? (
        <section className={styles.feedbackCard}>
          <Spin size="large" />
          <p>正在整理你的旅行规划...</p>
        </section>
      ) : pagedTrips.length === 0 ? (
        <section className={styles.feedbackCard}>
          <Empty
            description={
              filteredTrips.length === 0 && allTrips.length > 0
                ? "当前筛选条件下暂无匹配的行程记录"
                : "你还没有保存行程，先去地图工作台生成一条吧"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" onClick={() => navigate("/")}>
            去创建行程
          </Button>
        </section>
      ) : (
        <>
          <section
            className={`${styles.tripList} ${viewMode === "grid" ? styles.tripListGrid : ""}`}
          >
            {pagedTrips.map((trip) => (
              <TripListCard
                key={trip.id}
                trip={trip}
                deleting={deleteUserTripMutation.isPending}
                sharing={updateUserTripShareMutation.isPending}
                onOpen={() => navigate(`/?tripId=${trip.id}`)}
                onDelete={() => void handleDeleteTrip(trip.id)}
                onToggleShare={(enabled) =>
                  handleToggleTripShare(trip.id, enabled)
                }
                onCopyShare={() => void handleCopyShareLink(trip.shareToken)}
              />
            ))}
          </section>

          <footer className={styles.paginationBar}>
            <span className={styles.totalText}>
              共 {filteredTrips.length} 条行程
            </span>
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={filteredTrips.length}
              showSizeChanger
              pageSizeOptions={["8", "12", "16", "24"]}
              onChange={(nextPage, nextPageSize) => {
                setPageNum(nextPage);
                setPageSize(nextPageSize);
              }}
              onShowSizeChange={(_, nextPageSize) => {
                setPageNum(1);
                setPageSize(nextPageSize);
              }}
            />
          </footer>
        </>
      )}
    </PersonalPageLayout>
  );
}

type TripListCardProps = {
  trip: UserTripSummaryDto;
  deleting: boolean;
  sharing: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onToggleShare: (enabled: boolean) => Promise<unknown> | void;
  onCopyShare: () => void;
};

/**
 * TripListCard 统一展示单条已保存规划，并承接公开分享、查看和删除操作。
 */
function TripListCard({
  trip,
  deleting,
  sharing,
  onOpen,
  onDelete,
  onToggleShare,
  onCopyShare,
}: TripListCardProps) {
  const isSchedule = trip.planMode === "schedule";

  return (
    <article className={styles.tripCard}>
      <div
        className={styles.cardCover}
        style={
          trip.coverUrl
            ? {
                backgroundImage: `url(${trip.coverUrl})`,
              }
            : undefined
        }
      />

      <div className={styles.cardBody}>
        <div className={styles.cardTitleSection}>
          <div className={styles.cardInfo}>
            <Tag
              className={styles.modeTag}
              color={isSchedule ? "green" : "blue"}
            >
              {isSchedule ? "完整行程" : "自由路线"}
            </Tag>
            <h2>{trip.tripName}</h2>
            <div className={styles.cardMeta}>
              <span>
                <EnvironmentOutlined />
                {trip.cityName}
              </span>
              {isSchedule && trip.startDate && trip.endDate ? (
                <span>
                  <CalendarOutlined />
                  {formatTripDateRange(trip.startDate, trip.endDate)}
                </span>
              ) : null}
            </div>
          </div>

          <div className={styles.cardActions}>
            <Button
              type="primary"
              className={styles.actionButton}
              onClick={onOpen}
            >
              查看行程
            </Button>
            <Popconfirm
              title="确定删除这条行程？"
              onConfirm={onDelete}
              okText="确定"
              cancelText="取消"
            >
              <button
                type="button"
                className={styles.moreButton}
                disabled={deleting}
              >
                <DeleteOutlined />
              </button>
            </Popconfirm>
          </div>
        </div>

        <div className={styles.cardMetrics}>
          <span>
            <ClockCircleOutlined />
            {isSchedule ? `${trip.days}天${trip.days - 1}晚` : "单日行程"}
          </span>
          <span>
            <CarOutlined />
            {formatRouteDistance(trip.totalDistance)}
          </span>
          <span>
            <ClockCircleOutlined />
            耗时 {formatTripDuration(trip.totalDuration)}
          </span>
          {/* todo: 后续 summary 接口补充景点/美食/酒店计数 */}
        </div>

        <p className={styles.cardSummary}>
          {trip.startName && trip.endName
            ? `从 ${trip.startName} 出发，前往 ${trip.endName}，开启一段难忘的${trip.cityName}之旅。`
            : `探索${trip.cityName}的魅力行程，包含${isSchedule ? trip.days + "天的深度体验" : "精心规划的路线"}。`}
        </p>

        <div className={styles.cardFooter}>
          <span className={styles.savedAt}>
            创建于 {formatDateTimeLabel(trip.createdAt)}
          </span>
          <div className={styles.shareActions}>
            <div className={styles.shareSwitch}>
              <span className={styles.shareLabel}>
                <ShareAltOutlined />
                公开分享
              </span>
              <Switch
                size="small"
                checked={Boolean(trip.isPublic)}
                loading={sharing}
                onChange={(checked) => void onToggleShare(checked)}
              />
            </div>
            <Button
              type={trip.isPublic ? "default" : "text"}
              size="small"
              icon={<LinkOutlined />}
              className={styles.copyShareButton}
              disabled={!trip.isPublic || !trip.shareToken}
              onClick={onCopyShare}
            >
              复制链接
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * 统一生成公开分享链接，确保“我的行程”和地图工作台使用同一入口协议。
 */
function buildTripShareLink(shareToken: string) {
  return `${window.location.origin}/?shareToken=${shareToken}`;
}

function formatTripDateRange(
  startDate?: string | null,
  endDate?: string | null,
) {
  if (!startDate && !endDate) {
    return "日期未设置";
  }
  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }
  return startDate || endDate || "日期未设置";
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
