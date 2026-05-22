import {
  CalendarOutlined,
  CompassOutlined,
  EditOutlined,
  EnvironmentOutlined,
  HeartFilled,
  HeartOutlined,
  PushpinFilled,
  ReadOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Alert, Avatar, Button, Empty, Spin, Tag } from "antd";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PersonalPageLayout } from "../../components/personal";
import {
  useCheckinSpotsQuery,
  useCurrentUserQuery,
  useFavoriteSpotsQuery,
  useUserTripsQuery,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import type {
  CheckinSpotItemDto,
  FavoriteSpotItemDto,
  UserTripSummaryDto,
} from "../../types/mapWorkbench";
import styles from "./ProfilePage.module.css";

const PROFILE_FAVORITE_PAGE_SIZE = 6;
const PROFILE_CHECKIN_PAGE_SIZE = 20;
const PROFILE_TRIP_PAGE_SIZE = 100;
const EMPTY_FAVORITES: FavoriteSpotItemDto[] = [];
const EMPTY_CHECKINS: CheckinSpotItemDto[] = [];
const EMPTY_TRIPS: UserTripSummaryDto[] = [];

// ProfilePage 是个人中心聚合页，先复用已有收藏、足迹、行程接口，不额外增加后端契约。
export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const favoriteSpotsQuery = useFavoriteSpotsQuery(
    {
      sortBy: "latest",
      pageNum: 1,
      pageSize: PROFILE_FAVORITE_PAGE_SIZE,
    },
    Boolean(authToken),
  );
  const checkinSpotsQuery = useCheckinSpotsQuery(
    {
      sortBy: "latest",
      pageNum: 1,
      pageSize: PROFILE_CHECKIN_PAGE_SIZE,
    },
    Boolean(authToken),
  );
  const userTripsQuery = useUserTripsQuery(
    {
      pageNum: 1,
      pageSize: PROFILE_TRIP_PAGE_SIZE,
    },
    Boolean(authToken),
  );

  const favoriteSpots = favoriteSpotsQuery.data?.list ?? EMPTY_FAVORITES;
  const checkinSpots = checkinSpotsQuery.data?.list ?? EMPTY_CHECKINS;
  const userTrips = userTripsQuery.data?.list ?? EMPTY_TRIPS;
  const profileStats = useMemo(
    () =>
      buildProfileStats({
        checkins: checkinSpots,
        favoriteTotal: favoriteSpotsQuery.data?.total ?? 0,
        trips: userTrips,
        tripTotal: userTripsQuery.data?.total ?? 0,
      }),
    [
      checkinSpots,
      favoriteSpotsQuery.data?.total,
      userTrips,
      userTripsQuery.data?.total,
    ],
  );
  const heroCoverUrl =
    userTrips.find((trip) => trip.coverUrl)?.coverUrl ??
    favoriteSpots.find((spot) => spot.coverUrl)?.coverUrl;

  function handleLogout() {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    queryClient.removeQueries({ queryKey: ["favorite-spots"] });
    queryClient.removeQueries({ queryKey: ["checkin-spots"] });
    queryClient.removeQueries({ queryKey: ["user-trips"] });
    navigate("/");
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty
          description="登录后即可查看你的个人主页"
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
        <p>正在加载个人主页...</p>
      </main>
    );
  }

  if (currentUserQuery.error || !currentUserQuery.data) {
    return (
      <main className={styles.stateShell}>
        <Alert
          type="error"
          showIcon
          message="个人主页暂时无法访问"
          description="请重新登录后再试。"
        />
        <Button onClick={() => navigate("/")}>返回首页</Button>
      </main>
    );
  }

  const currentUser = currentUserQuery.data;
  const isLoadingProfileData =
    favoriteSpotsQuery.isLoading ||
    checkinSpotsQuery.isLoading ||
    userTripsQuery.isLoading;
  const hasProfileDataError =
    favoriteSpotsQuery.error || checkinSpotsQuery.error || userTripsQuery.error;

  return (
    <PersonalPageLayout
      currentUser={currentUser}
      title="个人主页"
      description="汇总你的旅行收藏、足迹和路线记录。"
      onLogout={handleLogout}
      actions={
        <Button icon={<EditOutlined />} type="primary">
          编辑资料
        </Button>
      }
    >
      {hasProfileDataError ? (
        <Alert
          className={styles.profileAlert}
          type="warning"
          showIcon
          message="部分个人数据加载失败"
          description="当前页面会优先展示已成功获取的数据。"
        />
      ) : null}

      <section
        className={styles.heroCard}
        style={
          heroCoverUrl
            ? {
                backgroundImage: `linear-gradient(90deg, rgb(240 247 255 / 94%) 0%, rgb(240 247 255 / 76%) 45%, rgb(20 46 88 / 18%) 100%), url(${heroCoverUrl})`,
              }
            : undefined
        }
      >
        <div className={styles.heroInfo}>
          <div className={styles.avatarWrap}>
            <Avatar
              className={styles.avatar}
              size={96}
              src={currentUser.avatarUrl || undefined}
            >
              {currentUser.nickname.slice(0, 1)}
            </Avatar>
            <span>{resolveUserLevel(currentUser.userType)}</span>
          </div>
          <div>
            <div className={styles.heroTitleRow}>
              <h2>Hi，{currentUser.nickname}</h2>
              <Tag className={styles.levelTag}>
                {resolveUserTypeLabel(currentUser.userType)}
              </Tag>
            </div>
            <p className={styles.heroSlogan}>用脚步丈量世界，用地图记录美好</p>
            <div className={styles.heroMeta}>
              <span>
                <EnvironmentOutlined />
                {resolveHomeCity(checkinSpots, userTrips)}
              </span>
              <span>
                <CalendarOutlined />
                加入时间：{formatDate(currentUser.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.statsPanel}>
          {profileStats.map((item) => (
            <div className={styles.statItem} key={item.label}>
              <span className={styles.statIcon}>{item.icon}</span>
              <strong>{item.value}</strong>
              <em>{item.label}</em>
            </div>
          ))}
        </div>
      </section>

      {isLoadingProfileData ? (
        <section className={styles.loadingCard}>
          <Spin />
          <span>正在整理你的旅行数据...</span>
        </section>
      ) : null}

      <section className={styles.dashboardGrid}>
        <FootprintCard checkins={checkinSpots} onOpen={() => navigate("/checkins")} />
        <RecentTripsCard trips={userTrips.slice(0, 3)} onOpen={() => navigate("/trips")} />
        <RecentCheckinsCard
          checkins={checkinSpots.slice(0, 4)}
          onOpen={() => navigate("/checkins")}
          onSpotOpen={(spotId) => navigate(`/?spotId=${spotId}`)}
        />
      </section>

      <FavoritesStrip
        favorites={favoriteSpots}
        onOpen={() => navigate("/favorites")}
        onSpotOpen={(spotId) => navigate(`/?spotId=${spotId}`)}
      />
    </PersonalPageLayout>
  );
}

function FootprintCard({
  checkins,
  onOpen,
}: {
  checkins: CheckinSpotItemDto[];
  onOpen: () => void;
}) {
  const visitedCityCount = new Set(checkins.map((spot) => spot.cityName)).size;

  return (
    <section className={styles.footprintCard}>
      <PanelTitle
        icon={<EnvironmentOutlined />}
        title="我的足迹地图"
        actionLabel="查看足迹地图"
        onAction={onOpen}
      />
      <div className={styles.chinaMapSketch} aria-hidden="true">
        {checkins.slice(0, 7).map((spot, index) => (
          <span
            key={spot.checkinId}
            className={styles.mapPoint}
            style={{
              left: `${22 + ((index * 13) % 58)}%`,
              top: `${32 + ((index * 17) % 42)}%`,
            }}
          />
        ))}
      </div>
      <div className={styles.footprintSummary}>
        <strong>累计去过 {visitedCityCount} 个城市</strong>
        <button type="button" onClick={onOpen}>
          查看足迹地图
        </button>
      </div>
    </section>
  );
}

function RecentTripsCard({
  trips,
  onOpen,
}: {
  trips: UserTripSummaryDto[];
  onOpen: () => void;
}) {
  return (
    <section className={styles.panelCard}>
      <PanelTitle
        icon={<ReadOutlined />}
        title="最近行程"
        actionLabel="查看全部"
        onAction={onOpen}
      />
      {trips.length === 0 ? (
        <Empty description="暂无保存行程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className={styles.tripRows}>
          {trips.map((trip) => (
            <article className={styles.tripRow} key={trip.id}>
              <div
                className={styles.tripCover}
                style={
                  trip.coverUrl
                    ? { backgroundImage: `url(${trip.coverUrl})` }
                    : undefined
                }
              />
              <div>
                <h3>{trip.tripName}</h3>
                <p>
                  {trip.cityName} · {trip.days} 天 ·{" "}
                  {trip.planMode === "schedule" ? "完整行程" : "自由路线"}
                </p>
              </div>
              <span>{formatDate(trip.createdAt)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentCheckinsCard({
  checkins,
  onOpen,
  onSpotOpen,
}: {
  checkins: CheckinSpotItemDto[];
  onOpen: () => void;
  onSpotOpen: (spotId: number) => void;
}) {
  return (
    <section className={styles.panelCard}>
      <PanelTitle
        icon={<PushpinFilled />}
        title="最近打卡"
        actionLabel="查看全部"
        onAction={onOpen}
      />
      {checkins.length === 0 ? (
        <Empty description="暂无打卡记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className={styles.checkinTimeline}>
          {checkins.map((spot) => (
            <button
              className={styles.checkinRow}
              type="button"
              key={spot.checkinId}
              onClick={() => onSpotOpen(spot.spotId)}
            >
              <span className={styles.timelineDot} />
              <img src={spot.coverUrl} alt={spot.name} />
              <strong>{spot.name}</strong>
              <em>{spot.cityName}</em>
              <time>{formatDate(spot.checkedInAt)}</time>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function FavoritesStrip({
  favorites,
  onOpen,
  onSpotOpen,
}: {
  favorites: FavoriteSpotItemDto[];
  onOpen: () => void;
  onSpotOpen: (spotId: number) => void;
}) {
  return (
    <section className={styles.favoritePanel}>
      <PanelTitle
        icon={<HeartFilled />}
        title="我的收藏"
        actionLabel="查看全部"
        onAction={onOpen}
      />
      {favorites.length === 0 ? (
        <Empty description="暂无收藏景点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className={styles.favoriteStrip}>
          {favorites.map((spot) => (
            <button
              className={styles.favoriteCard}
              type="button"
              key={spot.favoriteId}
              onClick={() => onSpotOpen(spot.spotId)}
            >
              <div
                className={styles.favoriteCover}
                style={{ backgroundImage: `url(${spot.coverUrl})` }}
              >
                <span>
                  <HeartOutlined />
                </span>
              </div>
              <strong>{spot.name}</strong>
              <em>
                {spot.cityName} · {spot.address}
              </em>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function PanelTitle({
  actionLabel,
  icon,
  onAction,
  title,
}: {
  actionLabel: string;
  icon: ReactNode;
  onAction: () => void;
  title: string;
}) {
  return (
    <header className={styles.panelTitle}>
      <h2>
        <span>{icon}</span>
        {title}
      </h2>
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </header>
  );
}

function buildProfileStats({
  checkins,
  favoriteTotal,
  trips,
  tripTotal,
}: {
  checkins: CheckinSpotItemDto[];
  favoriteTotal: number;
  trips: UserTripSummaryDto[];
  tripTotal: number;
}) {
  const visitedCityCount = new Set([
    ...checkins.map((spot) => spot.cityName),
    ...trips.map((trip) => trip.cityName),
  ]).size;
  const travelDays = trips.reduce((total, trip) => total + trip.days, 0);

  return [
    { label: "去过城市", value: visitedCityCount, icon: <RocketOutlined /> },
    { label: "收藏景点", value: favoriteTotal, icon: <HeartFilled /> },
    { label: "保存行程", value: tripTotal, icon: <ReadOutlined /> },
    { label: "打卡景点", value: checkins.length, icon: <PushpinFilled /> },
    { label: "旅行天数", value: travelDays, icon: <CompassOutlined /> },
  ];
}

function resolveHomeCity(
  checkins: CheckinSpotItemDto[],
  trips: UserTripSummaryDto[],
) {
  return checkins[0]?.cityName ?? trips[0]?.cityName ?? "中国";
}

function resolveUserTypeLabel(userType: string) {
  if (userType === "admin") {
    return "管理员";
  }
  if (userType === "member") {
    return "旅行达人";
  }
  return "旅行者";
}

function resolveUserLevel(userType: string) {
  if (userType === "admin") {
    return "Admin";
  }
  if (userType === "member") {
    return "Lv.3";
  }
  return "Lv.1";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "暂无";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`;
}
