import {
  AppstoreOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
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
  Tag,
} from "antd";
import { Scene, Map as L7Map, PointLayer } from "@antv/l7";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PersonalPageLayout } from "../../components/personal";
import {
  useAllTagsQuery,
  useCheckinSpotsQuery,
  useCitiesQuery,
  useCityTagsQuery,
  useCurrentUserQuery,
  useUncheckinSpotMutation,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import type {
  CheckinSpotItemDto,
  GeoPoint,
  SpotTagCode,
  SpotType,
} from "../../types/mapWorkbench";
import styles from "./CheckinsPage.module.css";

type CheckinViewMode = "timeline" | "grid";
type CheckinDateFilter = "all" | "7d" | "30d" | "365d";

// CheckinsPage 承接“我的足迹”页面：左侧 L7 点位图，右侧列表/卡片视图。
export function CheckinsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewMode, setViewMode] = useState<CheckinViewMode>("timeline");
  const [tagFilter, setTagFilter] = useState<"all" | SpotTagCode>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<CheckinDateFilter>("all");
  const [sortMode, setSortMode] = useState("latest");
  const [selectedSpotId, setSelectedSpotId] = useState<number>();
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const citiesQuery = useCitiesQuery();

  // 城市变化会影响标签来源，选择全部城市时使用全量标签。
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const selectedCityIdForTags = useMemo(() => {
    if (cityFilter === "all" || !citiesQuery.data?.list) {
      return undefined;
    }
    return citiesQuery.data.list.find((city) => city.name === cityFilter)?.id;
  }, [cityFilter, citiesQuery.data?.list]);

  const cityTagsQuery = useCityTagsQuery(selectedCityIdForTags);
  const allTagsQuery = useAllTagsQuery();
  const activeTags =
    cityFilter === "all" ? allTagsQuery.data : cityTagsQuery.data;

  const checkinQueryParams = useMemo(
    () => ({
      tagCode: tagFilter === "all" ? undefined : tagFilter,
      cityName: cityFilter === "all" ? undefined : cityFilter,
      checkedInWithinDays: resolveCheckedInWithinDays(dateFilter),
      sortBy: sortMode,
      pageNum,
      pageSize,
    }),
    [cityFilter, dateFilter, pageNum, pageSize, sortMode, tagFilter],
  );
  const checkinSpotsQuery = useCheckinSpotsQuery(
    checkinQueryParams,
    Boolean(authToken),
  );
  const uncheckinSpotMutation = useUncheckinSpotMutation();
  const currentPageCheckins = checkinSpotsQuery.data?.list ?? [];
  const totalCheckins = checkinSpotsQuery.data?.total ?? 0;

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
    queryClient.removeQueries({ queryKey: ["checkin-spots"] });
    queryClient.removeQueries({ queryKey: ["checkin-spot-status"] });
    navigate("/");
  }

  async function handleCancelCheckin(spotId: number) {
    await uncheckinSpotMutation.mutateAsync(spotId);
    await queryClient.invalidateQueries({ queryKey: ["checkin-spots"] });
    await queryClient.invalidateQueries({
      queryKey: ["checkin-spot-status", spotId],
    });
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty
          description="登录后即可查看你的旅行足迹"
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
        <p>正在加载你的足迹信息...</p>
      </main>
    );
  }

  if (currentUserQuery.error || !currentUserQuery.data) {
    return (
      <main className={styles.stateShell}>
        <Alert
          type="error"
          showIcon
          message="足迹页暂时无法访问"
          description="请重新登录后再试。"
        />
        <Button onClick={() => navigate("/")}>返回首页</Button>
      </main>
    );
  }

  return (
    <PersonalPageLayout
      currentUser={currentUserQuery.data}
      title="我的足迹"
      description="记录去过的景点，回看每一次旅行足迹。"
      onLogout={handleLogout}
    >

      <section className={styles.workspace}>
        <CheckinL7Map
          spots={currentPageCheckins}
          selectedSpotId={selectedSpotId}
          onSpotSelect={setSelectedSpotId}
        />

        <section className={styles.recordPanel}>
          <div className={styles.panelTop}>
            <div>
              <h2>打卡记录</h2>
              <span>按时间查看已去过的景点</span>
            </div>
            <Segmented
              className={styles.viewSwitch}
              value={viewMode}
              options={[
                {
                  label: "时间轴",
                  value: "timeline",
                  icon: <UnorderedListOutlined />,
                },
                {
                  label: "卡片",
                  value: "grid",
                  icon: <AppstoreOutlined />,
                },
              ]}
              onChange={(value) => setViewMode(value as CheckinViewMode)}
            />
          </div>

          <div className={styles.filterBar}>
            <Select
              value={cityFilter}
              options={cityOptions}
              onChange={(value) => {
                setCityFilter(value);
                setPageNum(1);
              }}
            />
            <Select
              value={tagFilter}
              options={typeOptions}
              onChange={(value) => {
                setTagFilter(value as "all" | SpotTagCode);
                setPageNum(1);
              }}
            />
            <Select
              value={dateFilter}
              options={[
                { label: "全部时间", value: "all" },
                { label: "近 7 天", value: "7d" },
                { label: "近 30 天", value: "30d" },
                { label: "近 1 年", value: "365d" },
              ]}
              onChange={(value) => {
                setDateFilter(value as CheckinDateFilter);
                setPageNum(1);
              }}
            />
            <Select
              value={sortMode}
              options={[
                { label: "最新打卡", value: "latest" },
                { label: "评分优先", value: "score" },
              ]}
              onChange={setSortMode}
            />
          </div>

          {checkinSpotsQuery.error ? (
            <section className={styles.feedbackCard}>
              <Alert
                type="error"
                showIcon
                message="足迹列表加载失败"
                description={
                  checkinSpotsQuery.error instanceof Error
                    ? checkinSpotsQuery.error.message
                    : "暂时无法获取你的打卡数据"
                }
              />
            </section>
          ) : checkinSpotsQuery.isLoading && !checkinSpotsQuery.data ? (
            <section className={styles.feedbackCard}>
              <Spin />
              <p>正在整理你的打卡记录...</p>
            </section>
          ) : currentPageCheckins.length === 0 ? (
            <section className={styles.feedbackCard}>
              <Empty
                description={
                  totalCheckins === 0 &&
                  tagFilter === "all" &&
                  cityFilter === "all" &&
                  dateFilter === "all"
                    ? "你还没有打卡景点，先去景点详情里标记去过吧"
                    : "当前筛选条件下暂无打卡记录"
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </section>
          ) : viewMode === "timeline" ? (
            <CheckinTimeline
              spots={currentPageCheckins}
              selectedSpotId={selectedSpotId}
              removing={uncheckinSpotMutation.isPending}
              onOpen={(spotId) => navigate(`/?spotId=${spotId}`)}
              onSelect={setSelectedSpotId}
              onCancel={(spotId) => void handleCancelCheckin(spotId)}
            />
          ) : (
            <CheckinCardGrid
              spots={currentPageCheckins}
              selectedSpotId={selectedSpotId}
              removing={uncheckinSpotMutation.isPending}
              onOpen={(spotId) => navigate(`/?spotId=${spotId}`)}
              onSelect={setSelectedSpotId}
              onCancel={(spotId) => void handleCancelCheckin(spotId)}
            />
          )}

          <footer className={styles.paginationBar}>
            <span>共 {totalCheckins} 条足迹</span>
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={totalCheckins}
              showSizeChanger
              pageSizeOptions={["8", "12", "16"]}
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
        </section>
      </section>
    </PersonalPageLayout>
  );
}

type CheckinL7MapProps = {
  onSpotSelect: (spotId: number) => void;
  selectedSpotId?: number;
  spots: CheckinSpotItemDto[];
};

function CheckinL7Map({ onSpotSelect, selectedSpotId, spots }: CheckinL7MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  // L7 场景由 DOM 容器承载，列表分页或筛选变化时重建图层，保证点位和右侧记录一致。
  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    sceneRef.current?.destroy();
    const center = resolveMapCenter(spots);
    const scene = new Scene({
      id: containerRef.current,
      map: new L7Map({
        center: [center.lng, center.lat],
        zoom: spots.length > 1 ? 9 : 11,
        pitch: 0,
        style: "light",
      }),
      logoVisible: false,
    });
    sceneRef.current = scene;

    scene.on("loaded", () => {
      if (spots.length === 0) {
        return;
      }

      const layerData = spots.map((spot) => ({
        ...spot,
        lng: spot.position.lng,
        lat: spot.position.lat,
        selected: spot.spotId === selectedSpotId ? 1 : 0,
        color: resolveSpotColor(spot.type),
      }));
      const pointLayer = new PointLayer({ name: "checkin-points" })
        .source(layerData, {
          parser: {
            type: "json",
            x: "lng",
            y: "lat",
          },
        })
        .shape("circle")
        .size("selected", (selected: number) => (selected ? 24 : 16))
        .color("color")
        .style({
          opacity: 0.9,
          strokeWidth: 3,
          stroke: "#ffffff",
          offsets: [0, 0],
        });

      // L7 图层事件类型较宽，这里只取 feature 原始数据用于联动右侧列表。
      (pointLayer as unknown as { on: (event: string, handler: (event: { feature?: CheckinSpotItemDto }) => void) => void }).on(
        "click",
        (event) => {
          if (event.feature?.spotId) {
            onSpotSelect(event.feature.spotId);
          }
        },
      );
      scene.addLayer(pointLayer);
    });

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [onSpotSelect, selectedSpotId, spots]);

  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapCanvas} ref={containerRef} />
      {spots.length === 0 ? (
        <div className={styles.mapEmpty}>
          <EnvironmentOutlined />
          <span>暂无可展示的打卡点</span>
        </div>
      ) : null}
      <div className={styles.mapLegend}>
        <span><i className={styles.legendChecked} />已打卡景点</span>
        <span><i className={styles.legendSelected} />当前选中</span>
      </div>
    </section>
  );
}

type CheckinListProps = {
  onCancel: (spotId: number) => void;
  onOpen: (spotId: number) => void;
  onSelect: (spotId: number) => void;
  removing: boolean;
  selectedSpotId?: number;
  spots: CheckinSpotItemDto[];
};

function CheckinTimeline({
  onCancel,
  onOpen,
  onSelect,
  removing,
  selectedSpotId,
  spots,
}: CheckinListProps) {
  return (
    <section className={styles.timelineList}>
      {spots.map((spot) => (
        <CheckinRecordCard
          key={spot.checkinId}
          layout="timeline"
          selected={spot.spotId === selectedSpotId}
          spot={spot}
          removing={removing}
          onCancel={() => onCancel(spot.spotId)}
          onOpen={() => onOpen(spot.spotId)}
          onSelect={() => onSelect(spot.spotId)}
        />
      ))}
    </section>
  );
}

function CheckinCardGrid(props: CheckinListProps) {
  return (
    <section className={styles.cardGrid}>
      {props.spots.map((spot) => (
        <CheckinRecordCard
          key={spot.checkinId}
          layout="grid"
          selected={spot.spotId === props.selectedSpotId}
          spot={spot}
          removing={props.removing}
          onCancel={() => props.onCancel(spot.spotId)}
          onOpen={() => props.onOpen(spot.spotId)}
          onSelect={() => props.onSelect(spot.spotId)}
        />
      ))}
    </section>
  );
}

type CheckinRecordCardProps = {
  layout: CheckinViewMode;
  onCancel: () => void;
  onOpen: () => void;
  onSelect: () => void;
  removing: boolean;
  selected: boolean;
  spot: CheckinSpotItemDto;
};

function CheckinRecordCard({
  layout,
  onCancel,
  onOpen,
  onSelect,
  removing,
  selected,
  spot,
}: CheckinRecordCardProps) {
  return (
    <article
      className={`${styles.recordCard} ${layout === "grid" ? styles.recordCardGrid : ""} ${selected ? styles.recordCardSelected : ""}`}
      onClick={onSelect}
    >
      {layout === "timeline" ? (
        <div className={styles.timelineNode}>
          <span>{formatDayLabel(spot.checkedInAt)}</span>
        </div>
      ) : null}
      <div
        className={styles.recordCover}
        style={spot.coverUrl ? { backgroundImage: `url(${spot.coverUrl})` } : undefined}
      />
      <div className={styles.recordBody}>
        <div className={styles.recordTitleRow}>
          <h3>{spot.name}</h3>
          <span>{resolveSpotTypeLabel(spot.type)}</span>
        </div>
        <p className={styles.recordMeta}>
          <EnvironmentOutlined />
          {spot.cityName} · {spot.address}
        </p>
        <p className={styles.recordTime}>
          <ClockCircleOutlined />
          打卡于 {formatDateTime(spot.checkedInAt)}
        </p>
        <p className={styles.recordRemark}>
          {spot.remark || spot.summary || spot.recommendReason}
        </p>
        <div className={styles.tagRow}>
          {spot.tags.slice(0, 3).map((tag) => (
            <Tag key={tag.id}>{tag.name}</Tag>
          ))}
        </div>
        <div className={styles.recordActions}>
          <Button size="small" icon={<EyeOutlined />} onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}>
            查看景点
          </Button>
          <Popconfirm
            title="取消这条打卡？"
            okText="取消打卡"
            cancelText="再想想"
            onConfirm={(event) => {
              event?.stopPropagation();
              onCancel();
            }}
          >
            <Button
              danger
              size="small"
              loading={removing}
              icon={<DeleteOutlined />}
              onClick={(event) => event.stopPropagation()}
            >
              取消打卡
            </Button>
          </Popconfirm>
        </div>
      </div>
    </article>
  );
}

function resolveCheckedInWithinDays(dateFilter: CheckinDateFilter) {
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

function resolveMapCenter(spots: CheckinSpotItemDto[]): GeoPoint {
  if (spots.length === 0) {
    return { lng: 104.066541, lat: 30.572269 };
  }
  const totals = spots.reduce(
    (acc, spot) => ({
      lng: acc.lng + spot.position.lng,
      lat: acc.lat + spot.position.lat,
    }),
    { lng: 0, lat: 0 },
  );
  return {
    lng: totals.lng / spots.length,
    lat: totals.lat / spots.length,
  };
}

function resolveSpotColor(type: SpotType) {
  switch (type) {
    case "food":
    case "night":
      return "#ff8a1f";
    case "museum":
    case "history":
      return "#2266e8";
    case "family":
      return "#10b981";
    default:
      return "#14b8a6";
  }
}

function resolveSpotTypeLabel(type: SpotType) {
  switch (type) {
    case "history":
      return "历史文化";
    case "nature":
      return "自然风光";
    case "landmark":
      return "城市地标";
    case "museum":
      return "博物馆";
    case "food":
      return "美食";
    case "night":
      return "夜游";
    case "family":
      return "亲子";
    case "business":
      return "商圈";
    default:
      return "景点";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "足迹";
  }
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
