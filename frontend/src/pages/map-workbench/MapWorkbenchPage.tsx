import { Alert, Empty, Spin } from "antd";
import { useMemo, useState } from "react";
import { fetchPoiCalibrationCandidates } from "../../api/mapWorkbench";
import { BaiduMapStage } from "../../components/map-workbench/BaiduMapStage";
import { RoutePlanDrawer } from "../../components/map-workbench/RoutePlanDrawer";
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
  PlanMode,
  RoutePlanResponseDto,
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
            <span>{candidate.address || `${candidate.city}${candidate.area}`}</span>
          </div>
        ),
      })),
    [poiCandidatesQuery.data],
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

    setPlannerAssistError(undefined);
    const startPointName = startPoint.trim() || `${city.name}市中心`;
    const resolvedStartPosition =
      startPointPosition ??
      (await resolveStartPointPosition(city.name, startPointName, city.center));
    const result = await routePlanMutation.mutateAsync({
      cityId: city.id,
      startPoint: {
        name: startPointName,
        position: resolvedStartPosition,
      },
      spotIds: tripSpots.map((spot) => spot.id),
      transportType: selectedTransport,
      planMode: selectedPlanMode,
    });
    setRoutePlanResult(result);
  }

  /**
   * 用户只输入地点名称时，先尝试用百度地点检索解析成坐标。
   * 当前取第一候选项，优先使用更适合导航落点的 naviLocation。
   */
  async function resolveStartPointPosition(cityName: string, keyword: string, fallbackPosition: TravelCity["center"]) {
    if (!keyword.trim()) {
      return fallbackPosition;
    }

    try {
      const fallbackCandidates = poiCandidatesQuery.data?.length
        ? poiCandidatesQuery.data
        : await fetchPoiCalibrationCandidates(normalizeCityName(cityName), keyword.trim());
      const firstCandidate = fallbackCandidates[0];
      if (firstCandidate) {
        return firstCandidate.naviLocation ?? firstCandidate.location ?? fallbackPosition;
      }
    } catch {
      setPlannerAssistError("起点检索失败，当前已回退为城市中心点");
      return fallbackPosition;
    }

    setPlannerAssistError("起点未命中候选地点，当前已回退为城市中心点");
    return fallbackPosition;
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
          routeSegments={routePlanResult?.segments}
          onSelectSpot={setSelectedSpotId}
        />

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
              onClose={() => setRoutePlanResult(undefined)}
            />
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
            onClearTrip={() => {
              setTripSpotIds([]);
              setRoutePlanResult(undefined);
            }}
          />
        </div>
      </section>
    </main>
  );
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
  if (cityName.endsWith("市") || cityName.endsWith("区") || cityName.endsWith("州")) {
    return cityName;
  }
  return `${cityName}市`;
}
