import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  HeartOutlined,
  ReadOutlined,
  RightOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Pagination,
  Popconfirm,
  Segmented,
  Spin,
  Tag,
  message,
} from "antd";
import type { MenuProps } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCurrentUserQuery,
  useDeleteUserTripMutation,
  useUserTripDetailQuery,
  useUserTripsQuery,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import type { AppUserDto } from "../../types/auth";
import type {
  UserTripDayDetailDto,
  UserTripDetailDto,
  UserTripItemDetailDto,
  UserTripSummaryDto,
} from "../../types/mapWorkbench";
import {
  formatRouteDistance,
  formatTripDuration,
} from "../../utils/map-workbench/routeDisplay";
import styles from "./MyTripsPage.module.css";

type TripViewMode = "grid" | "timeline";
const EMPTY_TRIPS: UserTripSummaryDto[] = [];

// MyTripsPage 负责承接“我的行程”列表、详情和删除管理。
export function MyTripsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewMode, setViewMode] = useState<TripViewMode>("grid");
  const [selectedTripId, setSelectedTripId] = useState<number>();
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const userTripsQuery = useUserTripsQuery({ pageNum, pageSize }, Boolean(authToken));
  const userTripDetailQuery = useUserTripDetailQuery(selectedTripId, Boolean(authToken && selectedTripId));
  const deleteUserTripMutation = useDeleteUserTripMutation();
  const currentPageTrips = userTripsQuery.data?.list ?? EMPTY_TRIPS;
  const totalTrips = userTripsQuery.data?.total ?? 0;
  const tripStats = useMemo(() => buildTripStats(currentPageTrips, totalTrips), [currentPageTrips, totalTrips]);

  const userMenuItems = buildUserMenuItems(
    currentUserQuery.data,
    () => navigate("/favorites"),
    () => navigate("/trips"),
    () => navigate("/admin"),
    () => {
      clearAuthToken();
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      queryClient.removeQueries({ queryKey: ["favorite-spots"] });
      queryClient.removeQueries({ queryKey: ["user-trips"] });
      navigate("/");
    },
  );

  async function handleDeleteTrip(tripId: number) {
    await deleteUserTripMutation.mutateAsync(tripId);
    message.success("行程已删除");
    if (selectedTripId === tripId) {
      setSelectedTripId(undefined);
    }
    await queryClient.invalidateQueries({ queryKey: ["user-trips"] });
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty
          description="登录后即可查看你保存的行程"
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
        <p>正在加载你的行程信息...</p>
      </main>
    );
  }

  if (currentUserQuery.error || !currentUserQuery.data) {
    return (
      <main className={styles.stateShell}>
        <Alert
          type="error"
          showIcon
          message="行程页暂时无法访问"
          description="请重新登录后再试。"
        />
        <Button onClick={() => navigate("/")}>返回首页</Button>
      </main>
    );
  }

  return (
    <main className={styles.pageShell}>
      <header className={styles.pageHeader}>
        <div className={styles.headerMain}>
          <div>
            <h1>我的行程</h1>
            <span className={styles.headerHint}>把每一次规划留在账号里，随时回看与继续出发</span>
          </div>

          <div className={styles.headerActions}>
            <Button
              className={styles.ghostButton}
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/")}
            >
              返回首页
            </Button>
            <Segmented
              className={styles.viewSwitch}
              value={viewMode}
              options={[
                { label: "卡片浏览", value: "grid", icon: <AppstoreOutlined /> },
                { label: "时间脉络", value: "timeline", icon: <CalendarOutlined /> },
              ]}
              onChange={(value) => setViewMode(value as TripViewMode)}
            />
            <Dropdown trigger={["click"]} menu={{ items: userMenuItems }}>
              <button type="button" className={styles.userButton}>
                <Avatar
                  size={42}
                  src={currentUserQuery.data.avatarUrl || undefined}
                  className={styles.userAvatar}
                />
                <div className={styles.userMeta}>
                  <strong>{currentUserQuery.data.nickname}</strong>
                  <span>@{currentUserQuery.data.username}</span>
                </div>
              </button>
            </Dropdown>
          </div>
        </div>

        <section className={styles.statsStrip}>
          <StatCard label="已保存行程" value={`${tripStats.total}`} accent="blue" />
          <StatCard label="完整行程" value={`${tripStats.scheduleCount}`} accent="cyan" />
          <StatCard label="自由路线" value={`${tripStats.freeCount}`} accent="gold" />
          <StatCard label="最近一次保存" value={tripStats.latestLabel} accent="slate" />
        </section>
      </header>

      {userTripsQuery.error ? (
        <section className={styles.feedbackCard}>
          <Alert
            type="error"
            showIcon
            message="行程列表加载失败"
            description={
              userTripsQuery.error instanceof Error
                ? userTripsQuery.error.message
                : "暂时无法获取你的行程数据"
            }
          />
        </section>
      ) : userTripsQuery.isLoading && !userTripsQuery.data ? (
        <section className={styles.feedbackCard}>
          <Spin size="large" />
          <p>正在整理你的行程记录...</p>
        </section>
      ) : currentPageTrips.length === 0 ? (
        <section className={styles.feedbackCard}>
          <Empty
            description="你还没有保存行程，先去地图工作台规划一条路线吧"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" onClick={() => navigate("/")}>
            去规划行程
          </Button>
        </section>
      ) : (
        <>
          {viewMode === "grid" ? (
            <section className={styles.cardGrid}>
              {currentPageTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  deleting={deleteUserTripMutation.isPending}
                  onOpen={() => setSelectedTripId(trip.id)}
                  onDelete={() => void handleDeleteTrip(trip.id)}
                />
              ))}
            </section>
          ) : (
            <section className={styles.timelineList}>
              {currentPageTrips.map((trip) => (
                <TimelineTripRow
                  key={trip.id}
                  trip={trip}
                  deleting={deleteUserTripMutation.isPending}
                  onOpen={() => setSelectedTripId(trip.id)}
                  onDelete={() => void handleDeleteTrip(trip.id)}
                />
              ))}
            </section>
          )}

          <footer className={styles.paginationBar}>
            <span className={styles.totalText}>共 {totalTrips} 条行程</span>
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={totalTrips}
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

      <Drawer
        title={null}
        placement="right"
        width={520}
        open={selectedTripId != null}
        onClose={() => setSelectedTripId(undefined)}
        className={styles.detailDrawer}
      >
        {userTripDetailQuery.isLoading ? (
          <div className={styles.drawerState}>
            <Spin size="large" />
          </div>
        ) : userTripDetailQuery.error ? (
          <Alert
            type="error"
            showIcon
            message="行程详情加载失败"
            description={
              userTripDetailQuery.error instanceof Error
                ? userTripDetailQuery.error.message
                : "暂时无法读取该行程详情"
            }
          />
        ) : userTripDetailQuery.data ? (
          <TripDetailPanel trip={userTripDetailQuery.data} />
        ) : null}
      </Drawer>
    </main>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent: "blue" | "cyan" | "gold" | "slate";
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard${capitalize(accent)}`]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type TripCardProps = {
  trip: UserTripSummaryDto;
  deleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

function TripCard({ trip, deleting, onOpen, onDelete }: TripCardProps) {
  return (
    <article className={styles.tripCard}>
      <div
        className={styles.cardCover}
        style={
          trip.coverUrl
            ? {
                backgroundImage: `linear-gradient(180deg, rgb(7 18 41 / 0%) 0%, rgb(7 18 41 / 72%) 100%), url(${trip.coverUrl})`,
              }
            : undefined
        }
      >
        <div className={styles.coverTop}>
          <Tag className={styles.modeTag} color={trip.planMode === "schedule" ? "blue" : "gold"}>
            {trip.planMode === "schedule" ? "完整行程" : "自由路线"}
          </Tag>
          <span className={styles.dayBadge}>{trip.days} 天</span>
        </div>

        <div className={styles.coverBottom}>
          <h2>{trip.tripName}</h2>
          <p>{trip.cityName}</p>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.routeMeta}>
          <span>
            <EnvironmentOutlined />
            {trip.startName || "未设置起点"}
          </span>
          <RightOutlined className={styles.routeArrow} />
          <span>{trip.endName || "按路线结束"}</span>
        </div>

        <div className={styles.cardStats}>
          <span>
            <CarOutlined />
            {formatRouteDistance(trip.totalDistance)}
          </span>
          <span>
            <ClockCircleOutlined />
            {formatTripDuration(trip.totalDuration)}
          </span>
          <span>
            <CalendarOutlined />
            {formatTripDateRange(trip.startDate, trip.endDate)}
          </span>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.savedAt}>保存于 {formatDateTimeLabel(trip.createdAt)}</span>
          <div className={styles.cardActions}>
            <Button type="default" icon={<EyeOutlined />} onClick={onOpen}>
              查看
            </Button>
            <Popconfirm
              title="删除这条行程？"
              description="删除后将无法继续在我的行程中查看。"
              okText="删除"
              cancelText="取消"
              onConfirm={onDelete}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                删除
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </article>
  );
}

type TimelineTripRowProps = TripCardProps;

function TimelineTripRow({ trip, deleting, onOpen, onDelete }: TimelineTripRowProps) {
  return (
    <article className={styles.timelineRow}>
      <div className={styles.timelineDate}>
        <strong>{formatShortDate(trip.createdAt)}</strong>
        <span>{trip.cityName}</span>
      </div>
      <div className={styles.timelineContent}>
        <div className={styles.timelineHeader}>
          <div>
            <h3>{trip.tripName}</h3>
            <p>
              {trip.startName || "未设置起点"} → {trip.endName || "按路线结束"}
            </p>
          </div>
          <Tag color={trip.planMode === "schedule" ? "blue" : "gold"}>
            {trip.planMode === "schedule" ? "完整行程" : "自由路线"}
          </Tag>
        </div>
        <div className={styles.timelineStats}>
          <span>{trip.days} 天</span>
          <span>{formatRouteDistance(trip.totalDistance)}</span>
          <span>{formatTripDuration(trip.totalDuration)}</span>
          <span>{formatTripDateRange(trip.startDate, trip.endDate)}</span>
        </div>
        <div className={styles.timelineActions}>
          <Button type="link" icon={<EyeOutlined />} onClick={onOpen}>
            查看详情
          </Button>
          <Popconfirm
            title="删除这条行程？"
            description="删除后将无法继续在我的行程中查看。"
            okText="删除"
            cancelText="取消"
            onConfirm={onDelete}
          >
            <Button type="link" danger icon={<DeleteOutlined />} loading={deleting}>
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>
    </article>
  );
}

function TripDetailPanel({ trip }: { trip: UserTripDetailDto }) {
  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHero}>
        <div>
          <div className={styles.detailTitleRow}>
            <h2>{trip.tripName}</h2>
            <Button type="text" icon={<ShareAltOutlined />} className={styles.shareButton}>
              分享
            </Button>
          </div>
          <p>{trip.cityName}</p>
        </div>
        <div className={styles.detailMetrics}>
          <div>
            <span>里程</span>
            <strong>{formatRouteDistance(trip.totalDistance)}</strong>
          </div>
          <div>
            <span>总时长</span>
            <strong>{formatTripDuration(trip.totalDuration)}</strong>
          </div>
        </div>
      </div>

      <section className={styles.detailRoute}>
        <div>
          <small>起点</small>
          <strong>{trip.startName || "未设置起点"}</strong>
        </div>
        <RightOutlined />
        <div>
          <small>终点</small>
          <strong>{trip.endName || "按路线结束"}</strong>
        </div>
      </section>

      <section className={styles.detailMetaStrip}>
        <Tag color="geekblue">{trip.planMode === "schedule" ? "完整行程" : "自由路线"}</Tag>
        <Tag>{getTransportLabel(trip.transportType)}</Tag>
        <Tag>{trip.days} 天</Tag>
        <Tag>{formatTripDateRange(trip.startDate, trip.endDate)}</Tag>
      </section>

      <section className={styles.dayList}>
        {trip.itineraryDays.map((day) => (
          <TripDaySection key={day.dayIndex} day={day} />
        ))}
      </section>
    </div>
  );
}

function TripDaySection({ day }: { day: UserTripDayDetailDto }) {
  return (
    <section className={styles.daySection}>
      <div className={styles.dayHeader}>
        <div>
          <h3>Day {day.dayIndex}</h3>
          <p>{day.items.length} 个节点</p>
        </div>
      </div>

      <div className={styles.dayTimeline}>
        {day.items.map((item) => (
          <div key={`${day.dayIndex}-${item.sortOrder}-${item.itemName}`} className={styles.dayItem}>
            <div className={`${styles.itemMarker} ${styles[`itemMarker${capitalize(item.itemType)}`]}`}>
              {resolveTripItemLabel(item.itemType)}
            </div>
            <div className={styles.itemContent}>
              <div className={styles.itemTitleRow}>
                <strong>{item.itemName}</strong>
                <span>{formatTimeRange(item.startTime, item.endTime)}</span>
              </div>
              <div className={styles.itemMeta}>
                <span>{resolveTripItemTypeText(item.itemType)}</span>
                {item.suggestedDuration ? <span>{formatTripDuration(item.suggestedDuration)}</span> : null}
                {item.lng != null && item.lat != null ? (
                  <span>
                    坐标 {item.lng.toFixed(3)}, {item.lat.toFixed(3)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildUserMenuItems(
  currentUser: AppUserDto | undefined,
  onFavoritesClick: () => void,
  onTripsClick: () => void,
  onAdminClick: () => void,
  onLogout: () => void,
): MenuProps["items"] {
  if (!currentUser) {
    return [];
  }

  return [
    {
      key: "profile",
      label: `${getUserTypeLabel(currentUser.userType)} · ${currentUser.username}`,
      disabled: true,
    },
    {
      key: "favorites",
      label: "我的收藏",
      icon: <HeartOutlined />,
      onClick: onFavoritesClick,
    },
    {
      key: "trips",
      label: "我的行程",
      icon: <ReadOutlined />,
      onClick: onTripsClick,
    },
    ...(currentUser.userType === "admin"
      ? [
          {
            key: "admin",
            label: "后台管理",
            icon: <AppstoreOutlined />,
            onClick: onAdminClick,
          },
        ]
      : []),
    {
      key: "logout",
      label: "退出登录",
      icon: <ArrowLeftOutlined />,
      danger: true,
      onClick: onLogout,
    },
  ];
}

function buildTripStats(trips: UserTripSummaryDto[], totalTrips: number) {
  const scheduleCount = trips.filter((trip) => trip.planMode === "schedule").length;
  const freeCount = trips.filter((trip) => trip.planMode === "free").length;
  const latest = trips[0]?.createdAt;
  return {
    total: totalTrips,
    scheduleCount,
    freeCount,
    latestLabel: latest ? formatShortDate(latest) : "--",
  };
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

function getTransportLabel(transportType: UserTripSummaryDto["transportType"]) {
  switch (transportType) {
    case "driving":
      return "驾车";
    case "walking":
      return "步行";
    case "bicycling":
      return "骑行";
    default:
      return "公共交通";
  }
}

function resolveTripItemLabel(itemType: UserTripItemDetailDto["itemType"]) {
  switch (itemType) {
    case "lunch":
      return "餐";
    case "rest":
      return "休";
    case "hotel":
      return "宿";
    default:
      return "景";
  }
}

function resolveTripItemTypeText(itemType: UserTripItemDetailDto["itemType"]) {
  switch (itemType) {
    case "lunch":
      return "用餐节点";
    case "rest":
      return "休息节点";
    case "hotel":
      return "住宿节点";
    default:
      return "景点节点";
  }
}

function formatTripDateRange(startDate?: string | null, endDate?: string | null) {
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
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeRange(startTime?: string | null, endTime?: string | null) {
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  return startTime || endTime || "时间未设置";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
