import {
  CloseOutlined,
  EditOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Drawer,
  Empty,
  FloatButton,
  Modal,
  Segmented,
  Spin,
} from "antd";
import { useMemo, useState, type DragEvent } from "react";
import { fetchPoiCalibrationCandidates } from "../../api/mapWorkbench";
import { BaiduMapStage } from "../../components/map-workbench/BaiduMapStage";
import { RoutePlanDrawer, type RouteTimelineFocusTarget } from "../../components/map-workbench/RoutePlanDrawer";
import { SchedulePlanFormFields } from "../../components/map-workbench/SchedulePlanFormFields";
import { SpotDetailPanel } from "../../components/map-workbench/SpotDetailPanel";
import {
  SpotRecommendList,
  type RecommendTab,
} from "../../components/map-workbench/SpotRecommendList";
import { TripPlannerDock } from "../../components/map-workbench/TripPlannerDock";
import {
  WorkbenchHeader,
  type ActiveSpotFilter,
} from "../../components/map-workbench/WorkbenchHeader";
import {
  useCitiesQuery,
  useCityDetailQuery,
  useCitySpotsQuery,
  useCityTagsQuery,
  usePoiCandidatesQuery,
  useRoutePlanMutation,
  useSpotDetailQuery,
} from "../../hooks/useMapWorkbenchData";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type {
  GeoPoint,
  ItineraryItemDto,
  LocationArrangeMode,
  PlanMode,
  RouteLocation,
  RouteSegmentDto,
  RoutePlanResponseDto,
  SchedulePlanConfig,
  SpotTag,
  SpotTagDto,
  SpotTagCode,
  TransportType,
  TravelCity,
  TravelCityDto,
  TravelSpot,
  TravelSpotDetailDto,
  TravelSpotSummaryDto,
} from "../../types/mapWorkbench";
import { wgs84ToGcj02 } from "../../utils/map-workbench/coordinate";
import { getItineraryActivityColor } from "../../utils/map-workbench/routePalette";
import { getVisibleSpots } from "../../utils/map-workbench/spotFilters";
import styles from "./MapWorkbenchPage.module.css";

const transportTypes = [
  { label: "公共交通", value: "transit" as const },
  { label: "驾车", value: "driving" as const },
  { label: "步行", value: "walking" as const },
  { label: "骑行", value: "bicycling" as const },
];

const planModes = [
  { label: "自由路线", value: "free" as const },
  { label: "完整行程", value: "schedule" as const },
];

const defaultScheduleConfig: SchedulePlanConfig = {
  tripDays: 2,
  dailyStartTime: "09:00",
  dailyEndTime: "18:00",
  includeLunchBreak: true,
  includeNightTour: false,
  intensity: "standard",
  lunchMode: "recommended",
  lunchPlaceName: "",
  restMode: "none",
  restPlaceName: "",
  hotelMode: "none",
  hotelName: "",
  returnToHotel: false,
  preferenceTags: [],
};

// MapWorkbenchPage 是地图工作台页面入口，只组织页面布局和跨组件共享状态。
export function MapWorkbenchPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveSpotFilter>("all");
  const [activeRecommendTab, setActiveRecommendTab] =
    useState<RecommendTab>("recommend");
  const [selectedCityId, setSelectedCityId] = useState<number>();
  const [selectedSpotId, setSelectedSpotId] = useState<number>();
  const [tripSpotIds, setTripSpotIds] = useState<number[]>([]);
  const [startPoint, setStartPoint] = useState("");
  const [startPointPosition, setStartPointPosition] = useState<GeoPoint>();
  const [locatingCurrentPosition, setLocatingCurrentPosition] = useState(false);
  const [plannerAssistError, setPlannerAssistError] = useState<string>();
  const [selectedTransport, setSelectedTransport] =
    useState<TransportType>("transit");
  const [selectedPlanMode, setSelectedPlanMode] = useState<PlanMode>("free");
  const [scheduleConfig, setScheduleConfig] = useState<SchedulePlanConfig>(
    defaultScheduleConfig,
  );
  const [scheduleConfigModalOpen, setScheduleConfigModalOpen] = useState(false);
  const [scheduleSettingsOpen, setScheduleSettingsOpen] = useState(false);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(1);
  const [mapFocusTarget, setMapFocusTarget] = useState<MapFocusTarget>();
  const [dragOverTripDock, setDragOverTripDock] = useState(false);
  const [routePlanResult, setRoutePlanResult] =
    useState<RoutePlanResponseDto>();
  const citiesQuery = useCitiesQuery();
  const routePlanMutation = useRoutePlanMutation();
  const cities = useMemo(
    () =>
      (citiesQuery.data?.list ?? [])
        .map(mapCity)
        .filter((city): city is TravelCity => Boolean(city)),
    [citiesQuery.data?.list],
  );
  // 用户未主动切换时默认使用第一个城市；如果当前选择不在列表中，也回退到第一个城市。
  const activeCityId = cities.some((city) => city.id === selectedCityId)
    ? selectedCityId
    : cities[0]?.id;
  const cityDetailQuery = useCityDetailQuery(activeCityId);
  const tagsQuery = useCityTagsQuery(activeCityId);
  const debouncedStartPoint = useDebouncedValue(startPoint, 300);
  const spotsQuery = useCitySpotsQuery(
    activeCityId,
    activeFilter,
    searchKeyword,
  );
  const city = useMemo(
    () =>
      mapCity(
        cityDetailQuery.data ?? cities.find((item) => item.id === activeCityId),
      ),
    [activeCityId, cities, cityDetailQuery.data],
  );
  const tags = useMemo(
    () => (tagsQuery.data ?? []).map(mapTag),
    [tagsQuery.data],
  );
  const poiCandidatesQuery = usePoiCandidatesQuery(
    city ? normalizeCityName(city.name) : undefined,
    debouncedStartPoint,
    !startPointPosition && !locatingCurrentPosition,
  );
  const spots = useMemo(
    () => (spotsQuery.data?.list ?? []).map((spot) => mapSpot(spot, city)),
    [city, spotsQuery.data?.list],
  );
  const visibleSpots = getVisibleSpots(
    spots,
    activeFilter,
    searchKeyword,
    activeRecommendTab,
  );
  // 工作台默认保持无选中态；只有用户主动选择且该景点仍在当前结果中时，才保留选中状态。
  const effectiveSelectedSpotId = visibleSpots.some(
    (spot) => spot.id === selectedSpotId,
  )
    ? selectedSpotId
    : undefined;
  const spotDetailQuery = useSpotDetailQuery(effectiveSelectedSpotId);
  const selectedSpot = useMemo(
    () =>
      mergeSpotDetail(
        visibleSpots.find((spot) => spot.id === effectiveSelectedSpotId),
        spotDetailQuery.data,
        city,
      ),
    [city, effectiveSelectedSpotId, spotDetailQuery.data, visibleSpots],
  );
  const nearbySpots = visibleSpots
    .filter((spot) => spot.id !== effectiveSelectedSpotId)
    .slice(0, 3);
  const tripSpots = tripSpotIds
    .map((spotId) => spots.find((spot) => spot.id === spotId))
    .filter((spot): spot is TravelSpot => Boolean(spot));
  const isInitialLoading =
    citiesQuery.isLoading ||
    (activeCityId != null &&
      (cityDetailQuery.isLoading ||
        tagsQuery.isLoading ||
        (!spotsQuery.data && spotsQuery.isLoading)));
  const pageError =
    citiesQuery.error ??
    cityDetailQuery.error ??
    tagsQuery.error ??
    spotsQuery.error;
  const startPointOptions = useMemo(
    () =>
      (poiCandidatesQuery.data ?? []).map((candidate) => ({
        value: candidate.name,
        position: candidate.naviLocation ?? candidate.location ?? undefined,
        label: (
          <div className={styles.startPointOption}>
            <strong>{candidate.name}</strong>
            <span>
              {candidate.address || `${candidate.city}${candidate.area}`}
            </span>
          </div>
        ),
      })),
    [poiCandidatesQuery.data],
  );
  // 只有在完整行程模式下且有编排结果时才展示时间轴，其他情况都展示完整路线，避免用户混淆。
  const showingScheduleResult =
    routePlanResult?.planMode === "schedule" &&
    routePlanResult.itineraryDays.length > 0;
  const activeScheduleDay = showingScheduleResult
    ? (routePlanResult.itineraryDays.find(
        (day) => day.dayIndex === selectedScheduleDay,
      ) ?? routePlanResult.itineraryDays[0])
    : undefined;
  const visibleRouteSegments = useMemo(() => {
    if (!routePlanResult) {
      return undefined;
    }

    if (!showingScheduleResult || !activeScheduleDay) {
      return routePlanResult.segments;
    }
    return resolveScheduleMapSegments(routePlanResult, activeScheduleDay);
  }, [activeScheduleDay, routePlanResult, showingScheduleResult]);
  const mapRouteOverlays = useMemo(
    () => buildMapRouteOverlays(routePlanResult, visibleRouteSegments, activeScheduleDay),
    [activeScheduleDay, routePlanResult, visibleRouteSegments],
  );
  const mapItineraryMarkers = useMemo(
    () => buildMapItineraryMarkers(activeScheduleDay?.items),
    [activeScheduleDay?.items],
  );

  // 加入行程时去重，避免同一个景点在路线规划池中重复出现。
  function handleAddToTrip(spotId: number) {
    setPlannerAssistError(undefined);
    setRoutePlanResult(undefined);
    setTripSpotIds((currentIds) =>
      currentIds.includes(spotId) ? currentIds : [...currentIds, spotId],
    );
  }

  // 删除行程池中的单个景点，其他景点顺序保持不变。
  function handleRemoveTripSpot(spotId: number) {
    setPlannerAssistError(undefined);
    setRoutePlanResult(undefined);
    setTripSpotIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== spotId),
    );
  }

  // 行程池排序会影响下一次路线规划的景点顺序，因此排序后清空旧规划结果。
  function handleReorderTripSpot(fromIndex: number, toIndex: number) {
    setPlannerAssistError(undefined);
    setRoutePlanResult(undefined);
    setTripSpotIds((currentIds) => reorderByIndex(currentIds, fromIndex, toIndex));
  }

  // 左侧推荐景点拖拽时只写入景点 id，底部行程栏负责接收并复用加入行程逻辑。
  function handleDragRecommendSpot(event: DragEvent<HTMLButtonElement>, spot: TravelSpot) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/trailmap-spot-id", String(spot.id));
    event.dataTransfer.setData("text/plain", String(spot.id));
  }

  function handleTripDockDragOver(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes("application/trailmap-spot-id")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOverTripDock(true);
  }

  function handleDropRecommendSpot(event: DragEvent<HTMLElement>) {
    const spotIdText = event.dataTransfer.getData("application/trailmap-spot-id");
    if (!spotIdText) {
      return;
    }

    event.preventDefault();
    setDragOverTripDock(false);
    const spotId = Number(spotIdText);
    if (Number.isFinite(spotId)) {
      handleAddToTrip(spotId);
    }
  }

  // 切换城市时同步清空景点选中和行程池，避免旧城市状态残留到新城市。
  function handleCityChange(cityId: number) {
    setSelectedCityId(cityId);
    setSelectedSpotId(undefined);
    setTripSpotIds([]);
    setRoutePlanResult(undefined);
    setStartPoint("");
    setStartPointPosition(undefined);
    setPlannerAssistError(undefined);
  }

  // 起点输入优先走百度地点检索拿候选坐标，失败或无结果时再回退到城市中心点。
  async function handlePlanRoute() {
    if (!city || tripSpots.length === 0) {
      return;
    }

    if (selectedPlanMode === "schedule") {
      setScheduleConfigModalOpen(true);
      return;
    }

    await submitRoutePlan();
  }

  // 完整行程模式先弹出详细配置，确认后再真正调用后端编排接口。
  async function handleSubmitSchedulePlan() {
    setScheduleConfigModalOpen(false);
    await submitRoutePlan(scheduleConfig);
  }

  // 统一路线规划提交逻辑，自由路线和完整行程只在参数上有差异。
  async function submitRoutePlan(config?: SchedulePlanConfig) {
    if (!city || tripSpots.length === 0) {
      return;
    }

    setPlannerAssistError(undefined);
    const startPointName = startPoint.trim() || `${city.name}市中心`;
    const resolvedStartPosition =
      startPointPosition ??
      (await resolveStartPointPosition(city.name, startPointName, city.center));
    const lunchLocation = config
      ? await resolveOptionalPlanLocation(
          city.name,
          config.lunchMode,
          config.lunchPlaceName,
          "午餐地点",
        )
      : undefined;
    const restLocation = config
      ? await resolveOptionalPlanLocation(
          city.name,
          config.restMode,
          config.restPlaceName,
          "休息地点",
        )
      : undefined;
    const hotelLocation = config
      ? await resolveOptionalPlanLocation(
          city.name,
          config.hotelMode,
          config.hotelName,
          "酒店地点",
        )
      : undefined;
    const result = await routePlanMutation.mutateAsync({
      cityId: city.id,
      startPoint: {
        name: startPointName,
        position: resolvedStartPosition,
      },
      spotIds: tripSpots.map((spot) => spot.id),
      transportType: selectedTransport,
      planMode: selectedPlanMode,
      tripDays: config?.tripDays,
      dailyStartTime: config?.dailyStartTime,
      dailyEndTime: config?.dailyEndTime,
      includeLunchBreak: config?.includeLunchBreak,
      includeNightTour: config?.includeNightTour,
      intensity: config?.intensity,
      lunchMode: config?.lunchMode,
      lunchLocation,
      restMode: config?.restMode,
      restLocation,
      hotelMode: config?.hotelMode,
      hotelLocation,
      returnToHotel: config?.returnToHotel,
    });
    setRoutePlanResult(result);
    if (result.planMode === "schedule" && result.itineraryDays.length > 0) {
      setSelectedScheduleDay(result.itineraryDays[0].dayIndex);
    }
  }

  /**
   * 用户只输入地点名称时，先尝试用百度地点检索解析成坐标。
   * 当前取第一候选项，优先使用更适合导航落点的 naviLocation。
   */
  async function resolveStartPointPosition(
    cityName: string,
    keyword: string,
    fallbackPosition: TravelCity["center"],
  ) {
    if (!keyword.trim()) {
      return fallbackPosition;
    }

    try {
      const fallbackCandidates = poiCandidatesQuery.data?.length
        ? poiCandidatesQuery.data
        : await fetchPoiCalibrationCandidates(
            normalizeCityName(cityName),
            keyword.trim(),
          );
      const firstCandidate = fallbackCandidates[0];
      if (firstCandidate) {
        return (
          firstCandidate.naviLocation ??
          firstCandidate.location ??
          fallbackPosition
        );
      }
    } catch {
      setPlannerAssistError("起点检索失败，当前已回退为城市中心点");
      return fallbackPosition;
    }

    setPlannerAssistError("起点未命中候选地点，当前已回退为城市中心点");
    return fallbackPosition;
  }

  // 完整行程的手动地点输入会在提交前统一解析，避免把“只写名称”的地点直接交给后端。
  async function resolveOptionalPlanLocation(
    cityName: string,
    mode: LocationArrangeMode,
    placeName: string,
    label: string,
  ): Promise<RouteLocation | undefined> {
    if (mode !== "manual") {
      return undefined;
    }

    const keyword = placeName.trim();
    if (!keyword) {
      throw new Error(`${label}不能为空`);
    }

    const candidates = await fetchPoiCalibrationCandidates(
      normalizeCityName(cityName),
      keyword,
    );
    const firstCandidate = candidates[0];
    const position =
      firstCandidate?.naviLocation ?? firstCandidate?.location ?? undefined;
    if (!firstCandidate || !position) {
      throw new Error(`${label}未命中候选地点，请换一个更具体的名称`);
    }

    return {
      name: firstCandidate.name,
      position,
      address: firstCandidate.address,
    };
  }

  // 用户从联想结果里选中起点时，直接绑定名称和对应坐标。
  function handleSelectStartPoint(value: string, position?: GeoPoint) {
    setRoutePlanResult(undefined);
    setPlannerAssistError(undefined);
    setStartPoint(value);
    setStartPointPosition(position);
  }

  // 浏览器当前位置会先从 WGS-84 转为 GCJ-02，再作为路线规划起点提交。
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setPlannerAssistError("当前浏览器不支持定位，请手动输入起点");
      return;
    }

    setLocatingCurrentPosition(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gcjPoint = wgs84ToGcj02({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
        setRoutePlanResult(undefined);
        setPlannerAssistError(undefined);
        setStartPoint("我的位置");
        setStartPointPosition(gcjPoint);
        setLocatingCurrentPosition(false);
      },
      () => {
        setPlannerAssistError("定位失败，请检查定位权限或手动输入起点");
        setLocatingCurrentPosition(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }

  // 右侧完整行程时间轴点击地点时，地图聚焦到该地点；景点同时同步左侧和地图选中态。
  function handleFocusRouteTimelineLocation(target: RouteTimelineFocusTarget) {
    if (target.spotId) {
      setSelectedSpotId(target.spotId);
    }

    setMapFocusTarget({
      key: `${target.key}-${Date.now()}`,
      position: target.position,
      zoom: 16,
    });
  }

  if (isInitialLoading) {
    return (
      <main className={styles.workbenchStateShell}>
        <Spin size="large" />
        <p>正在加载地图工作台数据...</p>
      </main>
    );
  }

  if (pageError || !city) {
    return (
      <main className={styles.workbenchStateShell}>
        <Alert
          type="error"
          showIcon
          message="地图工作台加载失败"
          description={
            pageError instanceof Error
              ? pageError.message
              : "暂时无法获取城市和景点数据"
          }
        />
      </main>
    );
  }

  return (
    <main className={styles.workbenchShell}>
      <WorkbenchHeader
        cities={cities}
        selectedCityId={activeCityId}
        cityName={city.name}
        tags={tags}
        searchKeyword={searchKeyword}
        activeFilter={activeFilter}
        onCityChange={handleCityChange}
        onSearchKeywordChange={setSearchKeyword}
        onActiveFilterChange={setActiveFilter}
      />

      <section className={styles.mapWorkspace} aria-label="地图工作台主体">
        <BaiduMapStage
          city={city}
          spots={visibleSpots}
          selectedSpot={selectedSpot}
          selectedSpotId={effectiveSelectedSpotId}
          routeSegments={visibleRouteSegments}
          routeOverlays={mapRouteOverlays}
          itineraryMarkers={mapItineraryMarkers}
          focusTarget={mapFocusTarget}
          onSelectSpot={setSelectedSpotId}
        />

        {showingScheduleResult ? (
          <div className={styles.scheduleDayTabsPanel}>
            <Segmented
              value={activeScheduleDay?.dayIndex}
              options={routePlanResult.itineraryDays.map((day) => ({
                label: (
                  <div className={styles.scheduleDayTab}>
                    <strong>{`Day ${day.dayIndex}`}</strong>
                    <span>{day.spots.length} 个景点</span>
                  </div>
                ),
                value: day.dayIndex,
              }))}
              onChange={(value) => setSelectedScheduleDay(value as number)}
            />
          </div>
        ) : null}

        <div className={styles.leftFloatPanel}>
          {spots.length === 0 ? (
            <aside className={styles.inlineStatePanel}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="当前城市暂无景点数据"
              />
            </aside>
          ) : (
            <SpotRecommendList
              cityName={city.name}
              spots={visibleSpots}
              tags={tags}
              activeTab={activeRecommendTab}
              selectedSpotId={effectiveSelectedSpotId}
              onActiveTabChange={setActiveRecommendTab}
              onSelectSpot={setSelectedSpotId}
              onDragSpotStart={handleDragRecommendSpot}
            />
          )}
        </div>

        {selectedSpot && !routePlanResult ? (
          <div className={styles.detailFloatPanel}>
            <SpotDetailPanel
              spot={selectedSpot}
              tags={tags}
              nearbySpots={nearbySpots}
              isInTrip={tripSpotIds.includes(selectedSpot.id)}
              onAddToTrip={handleAddToTrip}
              onSelectSpot={setSelectedSpotId}
            />
          </div>
        ) : null}

        {routePlanResult ? (
          <div className={styles.routeDrawerPanel}>
            <RoutePlanDrawer
              cityName={city.name}
              routePlan={routePlanResult}
              tripSpots={tripSpots}
              tags={tags}
              startPoint={startPoint.trim() || `${city.name}市中心`}
              startPosition={visibleRouteSegments?.[0]?.fromPosition ?? startPointPosition ?? city.center}
              scheduleStartTime={showingScheduleResult ? scheduleConfig.dailyStartTime : undefined}
              selectedDayIndex={activeScheduleDay?.dayIndex}
              onFocusLocation={handleFocusRouteTimelineLocation}
              onClose={() => setRoutePlanResult(undefined)}
            />
          </div>
        ) : null}

        {showingScheduleResult ? (
          <div className={styles.scheduleSettingsFab}>
            <FloatButton.Group shape="circle">
              <FloatButton
                icon={<SettingOutlined />}
                tooltip="行程设置"
                onClick={() => setScheduleSettingsOpen(true)}
              />
              <FloatButton
                icon={<CloseOutlined />}
                tooltip="关闭完整行程"
                onClick={() => setRoutePlanResult(undefined)}
              />
            </FloatButton.Group>
          </div>
        ) : null}

        <div className={styles.tripFloatPanel}>
          <TripPlannerDock
            tripSpots={tripSpots}
            transportTypes={transportTypes}
            planModes={planModes}
            startPoint={startPoint}
            startPointOptions={startPointOptions}
            selectedTransport={selectedTransport}
            selectedPlanMode={selectedPlanMode}
            planning={routePlanMutation.isPending}
            locatingCurrentPosition={locatingCurrentPosition}
            dragOverTrip={dragOverTripDock}
            planResult={routePlanResult}
            planError={
              (routePlanMutation.error instanceof Error
                ? routePlanMutation.error.message
                : undefined) ?? plannerAssistError
            }
            onStartPointChange={(value) => {
              setRoutePlanResult(undefined);
              setPlannerAssistError(undefined);
              setStartPoint(value);
              setStartPointPosition(undefined);
            }}
            onSelectStartPoint={handleSelectStartPoint}
            onUseCurrentLocation={handleUseCurrentLocation}
            onTransportChange={(value) => {
              setRoutePlanResult(undefined);
              setSelectedTransport(value);
            }}
            onPlanModeChange={(value) => {
              setRoutePlanResult(undefined);
              setSelectedPlanMode(value);
            }}
            onPlanRoute={handlePlanRoute}
            onRemoveSpot={handleRemoveTripSpot}
            onReorderSpot={handleReorderTripSpot}
            onDropRecommendSpot={handleDropRecommendSpot}
            onTripDragOver={handleTripDockDragOver}
            onTripDragLeave={() => setDragOverTripDock(false)}
            onClearTrip={() => {
              setTripSpotIds([]);
              setRoutePlanResult(undefined);
            }}
          />
        </div>
      </section>

      <Modal
        title="完整行程配置"
        open={scheduleConfigModalOpen}
        width={720}
        okText="生成完整行程"
        cancelText="取消"
        confirmLoading={routePlanMutation.isPending}
        onOk={handleSubmitSchedulePlan}
        onCancel={() => setScheduleConfigModalOpen(false)}
      >
        <div className={styles.scheduleDialogIntro}>
          <strong>先补齐核心偏好，再生成完整行程。</strong>
          <span>
            当前版本会把天数、作息、强度和午餐时段真正带进后端编排；酒店和偏好先做页面预留。
          </span>
        </div>
        <SchedulePlanFormFields
          value={scheduleConfig}
          onChange={setScheduleConfig}
        />
      </Modal>

      <Drawer
        title="行程设置"
        open={scheduleSettingsOpen}
        width={420}
        onClose={() => setScheduleSettingsOpen(false)}
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            loading={routePlanMutation.isPending}
            onClick={async () => {
              setScheduleSettingsOpen(false);
              await submitRoutePlan(scheduleConfig);
            }}
          >
            重新生成
          </Button>
        }
      >
        <div className={styles.scheduleDialogIntro}>
          <strong>这里专门用来调整完整行程。</strong>
          <span>
            右侧主区域保留当天详细行程，设置项收进抽屉里，避免和时间轴抢视线。
          </span>
        </div>
        <SchedulePlanFormFields
          value={scheduleConfig}
          onChange={setScheduleConfig}
        />
      </Drawer>
    </main>
  );
}

interface MapRouteOverlay {
  key: string;
  polyline: GeoPoint[];
  color: string;
  lineStyle: "solid" | "dashed";
  kind: "route" | "guide";
}

interface MapFocusTarget {
  key: string;
  position: GeoPoint;
  zoom?: number;
}

interface MapItineraryMarker {
  key: string;
  position: GeoPoint;
  itemType: "lunch" | "rest" | "hotel";
  title: string;
}

function buildMapRouteOverlays(
  routePlanResult?: RoutePlanResponseDto,
  visibleRouteSegments?: RouteSegmentDto[],
  activeDay?: RoutePlanResponseDto['itineraryDays'][number],
): MapRouteOverlay[] | undefined {
  if (!routePlanResult) {
    return undefined;
  }

  const auxiliaryItemMap = activeDay ? buildMapAuxiliaryItemMap(activeDay.items) : new Map<string, ItineraryItemDto>();
  const overlays: MapRouteOverlay[] = (visibleRouteSegments ?? routePlanResult.segments)
    .filter((segment) => segment.polyline.length >= 2)
    .map((segment, index) => {
      const auxiliarySegment = isMapAuxiliarySegment(segment, auxiliaryItemMap);
      return {
        key: `segment-${segment.segmentIndex}`,
        polyline: segment.polyline,
        color: auxiliarySegment ? getMapAuxiliarySegmentColor(segment, auxiliaryItemMap) : getRouteColor(index),
        lineStyle: auxiliarySegment ? "dashed" as const : "solid" as const,
        kind: auxiliarySegment ? "guide" as const : "route" as const,
      };
    });

  return overlays;
}

function buildMapAuxiliaryItemMap(items: ItineraryItemDto[]) {
  const itemMap = new Map<string, ItineraryItemDto>();
  items.forEach((item) => {
    if (isMapAuxiliaryItem(item)) {
      itemMap.set(normalizeMapPlaceName(item.placeName || item.title), item);
    }
  });
  return itemMap;
}

function isMapAuxiliaryItem(item: ItineraryItemDto): item is ItineraryItemDto & { itemType: "lunch" | "rest" | "hotel" } {
  return item.itemType === "lunch" || item.itemType === "rest" || item.itemType === "hotel";
}

function isMapAuxiliarySegment(segment: RouteSegmentDto, auxiliaryItemMap: Map<string, ItineraryItemDto>) {
  return auxiliaryItemMap.has(normalizeMapPlaceName(segment.fromName)) || auxiliaryItemMap.has(normalizeMapPlaceName(segment.toName));
}

function getMapAuxiliarySegmentColor(segment: RouteSegmentDto, auxiliaryItemMap: Map<string, ItineraryItemDto>) {
  const targetItem =
    auxiliaryItemMap.get(normalizeMapPlaceName(segment.toName)) ??
    auxiliaryItemMap.get(normalizeMapPlaceName(segment.fromName));

  if (targetItem && isMapAuxiliaryItem(targetItem)) {
    return getItineraryActivityColor(targetItem.itemType);
  }

  return "#7a8ca4";
}

function resolveScheduleMapSegments(routePlanResult: RoutePlanResponseDto, activeDay: RoutePlanResponseDto['itineraryDays'][number]) {
  if (activeDay.segments?.length) {
    return activeDay.segments;
  }

  const dayTargetNames = activeDay.items
    .filter((item) => item.position)
    .map((item) => normalizeMapPlaceName(item.placeName || item.title));
  let searchStartIndex = 0;
  const matchedSegments: RouteSegmentDto[] = [];

  dayTargetNames.forEach((targetName) => {
    const matchedIndex = routePlanResult.segments.findIndex(
      (segment, index) => index >= searchStartIndex && normalizeMapPlaceName(segment.toName) === targetName,
    );
    if (matchedIndex >= 0) {
      matchedSegments.push(routePlanResult.segments[matchedIndex]);
      searchStartIndex = matchedIndex + 1;
    }
  });

  return matchedSegments;
}

function normalizeMapPlaceName(placeName: string) {
  return placeName.trim().replace(/\s+/g, "").toLowerCase();
}

function buildMapItineraryMarkers(
  activeItems?: ItineraryItemDto[],
): MapItineraryMarker[] | undefined {
  const markers = (activeItems ?? [])
    .filter(
      (
        item,
      ): item is ItineraryItemDto & {
        position: GeoPoint;
        itemType: "lunch" | "rest" | "hotel";
      } => item.itemType !== "spot" && Boolean(item.position),
    )
    .map((item) => ({
      key: `${item.itemType}-${item.sequence}`,
      position: item.position,
      itemType: item.itemType,
      title: item.placeName || item.title,
    }));

  return markers.length ? markers : undefined;
}

function getRouteColor(index: number) {
  const ROUTE_SEGMENT_COLORS = ['#2d6bff', '#20a95a', '#f08b2f', '#7a5af8', '#ef5da8'];
  return ROUTE_SEGMENT_COLORS[index % ROUTE_SEGMENT_COLORS.length];
}

function reorderByIndex<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}


function mapCity(city?: TravelCity | TravelCityDto) {
  if (!city) {
    return undefined;
  }

  return {
    id: city.id,
    name: city.name,
    provinceName: city.provinceName,
    cityCode: city.cityCode,
    center: city.center,
    mapZoom: city.mapZoom,
    description: city.description,
    recommendDays: city.recommendDays,
  } satisfies TravelCity;
}

function mapTag(tag: SpotTagDto): SpotTag {
  return {
    id: tag.id,
    name: tag.name,
    code: tag.code,
    sortOrder: tag.sortOrder,
  };
}

function mapSpot(spot: TravelSpotSummaryDto, city?: TravelCity): TravelSpot {
  return {
    id: spot.id,
    cityId: spot.cityId,
    name: spot.name,
    type: spot.type,
    position: spot.position,
    address: spot.address,
    coverUrl: spot.coverUrl,
    summary: spot.summary,
    recommendReason: spot.recommendReason,
    openingHours: spot.openingHours,
    ticketInfo: spot.ticketInfo,
    suggestedDurationMinutes: spot.suggestedDurationMinutes,
    bestTime: spot.bestTime,
    recommendScore: spot.recommendScore,
    distanceText: formatDistanceText(city, spot.position),
    tags: spot.tags.map((tag) => tag.code as SpotTagCode),
  };
}

function mergeSpotDetail(
  spot: TravelSpot | undefined,
  detail: TravelSpotDetailDto | undefined,
  city?: TravelCity,
): TravelSpot | undefined {
  if (!spot && !detail) {
    return undefined;
  }

  if (!detail) {
    return spot;
  }

  return {
    id: detail.id,
    cityId: detail.cityId,
    name: detail.name,
    type: detail.type,
    position: detail.position,
    address: detail.address,
    coverUrl: detail.coverUrl,
    summary: detail.summary,
    recommendReason: detail.recommendReason,
    openingHours: detail.openingHours,
    ticketInfo: detail.ticketInfo,
    suggestedDurationMinutes: detail.suggestedDurationMinutes,
    bestTime: detail.bestTime,
    recommendScore: detail.recommendScore,
    distanceText:
      spot?.distanceText ?? formatDistanceText(city, detail.position),
    tags: detail.tags.map((tag) => tag.code as SpotTagCode),
    boundary: detail.boundary,
    description: detail.description,
    travelGuide: detail.travelGuide,
  };
}

function formatDistanceText(
  city: TravelCity | undefined,
  point: { lng: number; lat: number },
) {
  if (!city) {
    return "--";
  }

  const lngDelta = point.lng - city.center.lng;
  const latDelta = point.lat - city.center.lat;
  const distance = Math.sqrt(lngDelta * lngDelta + latDelta * latDelta) * 111;
  return `${distance.toFixed(1)}km`;
}

// 地点检索通常更偏好完整城市名，这里给常见城市补一个“市”后缀。
function normalizeCityName(cityName: string) {
  if (
    cityName.endsWith("市") ||
    cityName.endsWith("区") ||
    cityName.endsWith("州")
  ) {
    return cityName;
  }
  return `${cityName}市`;
}
