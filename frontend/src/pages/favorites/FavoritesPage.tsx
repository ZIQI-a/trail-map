import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  StarFilled,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  Empty,
  Pagination,
  Segmented,
  Select,
  Spin,
} from "antd";
import type { MenuProps } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserQuery, useFavoriteSpotsQuery, useUnfavoriteSpotMutation } from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import type { AppUserDto } from "../../types/auth";
import type { FavoriteSpotItemDto } from "../../types/mapWorkbench";
import styles from "./FavoritesPage.module.css";

type FavoriteViewMode = "grid" | "map";

const categoryItems = [
  { key: "all", label: "全部" },
  { key: "spot", label: "景点" },
  { key: "route", label: "路线" },
  { key: "city", label: "城市" },
] as const;

// FavoritesPage 负责独立承接“我的收藏”场景，当前先聚焦景点收藏列表。
export function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewMode, setViewMode] = useState<FavoriteViewMode>("grid");
  const [sortMode, setSortMode] = useState("latest");
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const favoriteSpotsQuery = useFavoriteSpotsQuery(pageNum, pageSize, Boolean(authToken));
  const unfavoriteSpotMutation = useUnfavoriteSpotMutation();

  const totalFavorites = favoriteSpotsQuery.data?.total ?? 0;

  const sortedFavoriteSpots = useMemo(() => {
    const favoriteSpots = favoriteSpotsQuery.data?.list ?? [];
    const items = [...favoriteSpots];
    if (sortMode === "score") {
      return items.sort((left, right) => right.recommendScore - left.recommendScore);
    }
    return items.sort(
      (left, right) =>
        new Date(right.favoritedAt).getTime() - new Date(left.favoritedAt).getTime(),
    );
  }, [favoriteSpotsQuery.data?.list, sortMode]);

  const userMenuItems = buildUserMenuItems(
    currentUserQuery.data,
    () => navigate("/favorites"),
    () => navigate("/admin"),
    () => {
      clearAuthToken();
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      queryClient.removeQueries({ queryKey: ["favorite-spots"] });
      queryClient.removeQueries({ queryKey: ["favorite-spot-status"] });
      navigate("/");
    },
  );

  async function handleUnfavorite(spotId: number) {
    await unfavoriteSpotMutation.mutateAsync(spotId);
    await queryClient.invalidateQueries({ queryKey: ["favorite-spots"] });
    await queryClient.invalidateQueries({ queryKey: ["favorite-spot-status", spotId] });
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty
          description="登录后即可查看你的景点收藏"
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
        <p>正在加载你的收藏信息...</p>
      </main>
    );
  }

  if (currentUserQuery.error || !currentUserQuery.data) {
    return (
      <main className={styles.stateShell}>
        <Alert
          type="error"
          showIcon
          message="收藏页暂时无法访问"
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
            <p className={styles.eyebrow}>我的收藏</p>
            <h1>收藏的美好，期待下一次出发</h1>
            <span className={styles.headerHint}>当前先展示已收藏景点，路线和城市收藏后续再接入。</span>
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
                { label: "卡片模式", value: "grid", icon: <AppstoreOutlined /> },
                { label: "地图模式", value: "map", icon: <EnvironmentOutlined /> },
              ]}
              onChange={(value) => setViewMode(value as FavoriteViewMode)}
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

        <div className={styles.categoryRail}>
          {categoryItems.map((item) => {
            const count =
              item.key === "all" || item.key === "spot" ? totalFavorites : 0;
            const disabled = item.key !== "all" && item.key !== "spot";
            return (
              <button
                key={item.key}
                type="button"
                className={`${styles.categoryItem} ${item.key === "spot" || item.key === "all" ? styles.categoryItemActive : ""}`}
                disabled={disabled}
              >
                <span>{item.label}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>
      </header>

      <section className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <Select value="spot" options={[{ label: "全部分类", value: "spot" }]} />
          <Select value="all" options={[{ label: "全部城市", value: "all" }]} />
          <Select value="favoritedAt" options={[{ label: "收藏时间", value: "favoritedAt" }]} />
        </div>

        <div className={styles.sortGroup}>
          <Select
            value={sortMode}
            options={[
              { label: "最新收藏", value: "latest" },
              { label: "评分优先", value: "score" },
            ]}
            onChange={setSortMode}
          />
        </div>
      </section>

      {viewMode === "map" ? (
        <section className={styles.inlineStateCard}>
          <EnvironmentOutlined />
          <div>
            <strong>地图模式准备中</strong>
            <p>当前按你的要求先完成景点收藏页，地图联动模式后续再接入。</p>
          </div>
        </section>
      ) : null}

      {favoriteSpotsQuery.error ? (
        <section className={styles.feedbackCard}>
          <Alert
            type="error"
            showIcon
            message="收藏列表加载失败"
            description={
              favoriteSpotsQuery.error instanceof Error
                ? favoriteSpotsQuery.error.message
                : "暂时无法获取你的收藏数据"
            }
          />
        </section>
      ) : favoriteSpotsQuery.isLoading && !favoriteSpotsQuery.data ? (
        <section className={styles.feedbackCard}>
          <Spin size="large" />
          <p>正在整理你的景点收藏...</p>
        </section>
      ) : sortedFavoriteSpots.length === 0 ? (
        <section className={styles.feedbackCard}>
          <Empty
            description="你还没有收藏景点，先去地图工作台逛逛吧"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" onClick={() => navigate("/")}>
            去发现景点
          </Button>
        </section>
      ) : (
        <>
          <section className={styles.cardGrid}>
            {sortedFavoriteSpots.map((spot) => (
              <FavoriteSpotCard
                key={spot.favoriteId}
                spot={spot}
                removing={unfavoriteSpotMutation.isPending}
                onOpen={() => navigate(`/?spotId=${spot.spotId}`)}
                onUnfavorite={() => void handleUnfavorite(spot.spotId)}
              />
            ))}
          </section>

          <footer className={styles.paginationBar}>
            <span className={styles.totalText}>共 {totalFavorites} 条收藏</span>
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={totalFavorites}
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
    </main>
  );
}

type FavoriteSpotCardProps = {
  onOpen: () => void;
  onUnfavorite: () => void;
  removing: boolean;
  spot: FavoriteSpotItemDto;
};

function FavoriteSpotCard({
  onOpen,
  onUnfavorite,
  removing,
  spot,
}: FavoriteSpotCardProps) {
  return (
    <article className={styles.favoriteCard}>
      <div
        className={styles.cardCover}
        style={
          spot.coverUrl
            ? { backgroundImage: `linear-gradient(180deg, rgb(10 21 43 / 0%) 0%, rgb(10 21 43 / 18%) 100%), url(${spot.coverUrl})` }
            : undefined
        }
      >
        <span className={styles.cardBadge}>景点</span>
        <button
          type="button"
          className={styles.favoriteToggle}
          disabled={removing}
          onClick={onUnfavorite}
          aria-label="取消收藏"
        >
          <HeartFilled />
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <h2>{spot.name}</h2>
          <button
            type="button"
            className={styles.openButton}
            onClick={onOpen}
            aria-label="查看景点"
          >
            <EyeOutlined />
          </button>
        </div>

        <p className={styles.cardMeta}>
          {spot.cityName} · {resolveSpotTypeLabel(spot.type)}
        </p>

        <div className={styles.cardStats}>
          <span>
            <StarFilled />
            {spot.recommendScore.toFixed(1)}
          </span>
          <span>{spot.hotScore} 热度</span>
          <span>{spot.ticketInfo || "票务待补充"}</span>
        </div>

        <p className={styles.cardSummary}>{spot.summary || spot.recommendReason}</p>

        <div className={styles.cardFooter}>
          <span className={styles.favoriteDate}>
            <CalendarOutlined />
            收藏于 {formatFavoriteDate(spot.favoritedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

function buildUserMenuItems(
  currentUser: AppUserDto | undefined,
  onFavoritesClick: () => void,
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

function resolveSpotTypeLabel(type: FavoriteSpotItemDto["type"]) {
  switch (type) {
    case "history":
      return "历史文化";
    case "nature":
      return "自然风光";
    case "landmark":
      return "城市地标";
    case "museum":
      return "博物馆展馆";
    case "food":
      return "美食街区";
    case "night":
      return "夜游景点";
    case "family":
      return "亲子游玩";
    case "business":
      return "商圈街区";
    default:
      return "景点";
  }
}

function formatFavoriteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
