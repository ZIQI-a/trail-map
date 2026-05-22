import {
  AppstoreOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  HeartFilled,
  StarFilled,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Pagination,
  Segmented,
  Select,
  Spin,
} from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PersonalPageLayout } from "../../components/personal";
import {
  useCurrentUserQuery,
  useCitiesQuery,
  useCityTagsQuery,
  useAllTagsQuery,
  useFavoriteSpotsQuery,
  useUnfavoriteSpotMutation,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import type {
  FavoriteSpotItemDto,
  SpotTagCode,
} from "../../types/mapWorkbench";
import styles from "./FavoritesPage.module.css";

type FavoriteViewMode = "grid" | "map";
type FavoriteDateFilter = "all" | "7d" | "30d" | "365d";

// todo 暂时用不上，只有景点展示
// const categoryItems = [
//   { key: "all", label: "全部" },
//   { key: "spot", label: "景点" },
//   { key: "route", label: "路线" },
//   { key: "city", label: "城市" },
// ] as const;

// FavoritesPage 负责独立承接“我的收藏”场景，当前先聚焦景点收藏列表。
export function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewMode, setViewMode] = useState<FavoriteViewMode>("grid");
  const [tagFilter, setTagFilter] = useState<"all" | SpotTagCode>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<FavoriteDateFilter>("all");
  const [sortMode, setSortMode] = useState("latest");
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const citiesQuery = useCitiesQuery();

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const selectedCityIdForTags = useMemo(() => {
    if (cityFilter === "all" || !citiesQuery.data?.list) {
      return undefined;
    }
    return citiesQuery.data.list.find((c) => c.name === cityFilter)?.id;
  }, [cityFilter, citiesQuery.data?.list]);

  // 当选择具体城市时，加载该城市的标签；当选择全部城市时，加载系统全量标签。
  const cityTagsQuery = useCityTagsQuery(selectedCityIdForTags);
  const allTagsQuery = useAllTagsQuery();

  const activeTags =
    cityFilter === "all" ? allTagsQuery.data : cityTagsQuery.data;

  const favoriteQueryParams = useMemo(
    () => ({
      tagCode: tagFilter === "all" ? undefined : tagFilter,
      cityName: cityFilter === "all" ? undefined : cityFilter,
      favoritedWithinDays: resolveFavoritedWithinDays(dateFilter),
      sortBy: sortMode,
      pageNum,
      pageSize,
    }),
    [cityFilter, dateFilter, pageNum, pageSize, sortMode, tagFilter],
  );
  const favoriteSpotsQuery = useFavoriteSpotsQuery(
    favoriteQueryParams,
    Boolean(authToken),
  );
  const unfavoriteSpotMutation = useUnfavoriteSpotMutation();
  const currentPageFavoriteSpots = favoriteSpotsQuery.data?.list ?? [];
  const totalFavorites = favoriteSpotsQuery.data?.total ?? 0;

  // 分类选项直接使用标签接口，根据城市筛选状态切换全量或城市特定标签。
  const typeOptions = useMemo(
    () => [
      { label: "全部分类", value: "all" },
      ...(activeTags ?? []).map((tag) => ({
        label: tag.name,
        value: tag.code,
      })),
    ],
    [activeTags],
  );

  // 城市选项直接使用城市接口，不再依赖收藏列表反推。
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

  function handleLogout() {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    queryClient.removeQueries({ queryKey: ["favorite-spots"] });
    queryClient.removeQueries({ queryKey: ["favorite-spot-status"] });
    navigate("/");
  }

  async function handleUnfavorite(spotId: number) {
    await unfavoriteSpotMutation.mutateAsync(spotId);
    await queryClient.invalidateQueries({ queryKey: ["favorite-spots"] });
    await queryClient.invalidateQueries({
      queryKey: ["favorite-spot-status", spotId],
    });
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
    <PersonalPageLayout
      currentUser={currentUserQuery.data}
      title="我的收藏"
      description="收藏的美好，期待下一次出发。"
      onLogout={handleLogout}
      actions={
        <Segmented
          className={styles.viewSwitch}
          value={viewMode}
          options={[
            {
              label: "卡片模式",
              value: "grid",
              icon: <AppstoreOutlined />,
            },
            {
              label: "地图模式",
              value: "map",
              icon: <EnvironmentOutlined />,
            },
          ]}
          onChange={(value) => setViewMode(value as FavoriteViewMode)}
        />
      }
    >

      <section className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <Select
            size="large"
            value={tagFilter}
            options={typeOptions}
            onChange={(value) => {
              setTagFilter(value as "all" | SpotTagCode);
              setPageNum(1);
            }}
          />
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
            value={dateFilter}
            options={[
              { label: "全部时间", value: "all" },
              { label: "近 7 天收藏", value: "7d" },
              { label: "近 30 天收藏", value: "30d" },
              { label: "近 1 年收藏", value: "365d" },
            ]}
            onChange={(value) => {
              setDateFilter(value as FavoriteDateFilter);
              setPageNum(1);
            }}
          />
        </div>

        <div className={styles.sortGroup}>
          <Select
            size="large"
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
      ) : currentPageFavoriteSpots.length === 0 ? (
        <section className={styles.feedbackCard}>
          <Empty
            description={
              totalFavorites === 0 &&
              tagFilter === "all" &&
              cityFilter === "all" &&
              dateFilter === "all"
                ? "你还没有收藏景点，先去地图工作台逛逛吧"
                : "当前筛选条件下暂无收藏景点，试试切换筛选条件"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" onClick={() => navigate("/")}>
            去发现景点
          </Button>
        </section>
      ) : (
        <>
          <section className={styles.cardGrid}>
            {currentPageFavoriteSpots.map((spot) => (
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
    </PersonalPageLayout>
  );
}

function resolveFavoritedWithinDays(dateFilter: FavoriteDateFilter) {
  if (dateFilter === "7d") {
    return 7;
  }
  if (dateFilter === "30d") {
    return 30;
  }
  if (dateFilter === "365d") {
    return 365;
  }
  return undefined;
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
            ? {
                backgroundImage: `linear-gradient(180deg, rgb(10 21 43 / 0%) 0%, rgb(10 21 43 / 18%) 100%), url(${spot.coverUrl})`,
              }
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

        <p className={styles.cardSummary}>
          {spot.summary || spot.recommendReason}
        </p>

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
