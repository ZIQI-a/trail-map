import { Alert, Empty, Spin } from 'antd';
import { useMemo, useState } from 'react';
import { BaiduMapStage } from '../../components/map-workbench/BaiduMapStage';
import { SpotDetailPanel } from '../../components/map-workbench/SpotDetailPanel';
import { SpotRecommendList, type RecommendTab } from '../../components/map-workbench/SpotRecommendList';
import { TripPlannerDock } from '../../components/map-workbench/TripPlannerDock';
import { WorkbenchHeader, type ActiveSpotFilter } from '../../components/map-workbench/WorkbenchHeader';
import { useCitiesQuery, useCityDetailQuery, useCitySpotsQuery, useCityTagsQuery, useSpotDetailQuery } from '../../hooks/useMapWorkbenchData';
import type {
  PlanMode,
  SpotTag,
  SpotTagDto,
  SpotTagCode,
  TransportType,
  TravelCity,
  TravelCityDto,
  TravelSpot,
  TravelSpotDetailDto,
  TravelSpotSummaryDto,
} from '../../types/mapWorkbench';
import { getVisibleSpots } from '../../utils/map-workbench/spotFilters';
import styles from './MapWorkbenchPage.module.css';

const transportTypes = [
  { label: '公共交通', value: 'transit' as const },
  { label: '驾车', value: 'driving' as const },
  { label: '步行', value: 'walking' as const },
  { label: '骑行', value: 'bicycling' as const },
  { label: '打车', value: 'taxi' as const },
];

const planModes = [
  { label: '自由路线', value: 'free' as const },
  { label: '完整行程', value: 'schedule' as const },
];

// MapWorkbenchPage 是地图工作台页面入口，只组织页面布局和跨组件共享状态。
export function MapWorkbenchPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveSpotFilter>('all');
  const [activeRecommendTab, setActiveRecommendTab] = useState<RecommendTab>('recommend');
  const [selectedCityId, setSelectedCityId] = useState<number>();
  const [selectedSpotId, setSelectedSpotId] = useState<number>();
  const [tripSpotIds, setTripSpotIds] = useState<number[]>([]);
  const [startPoint, setStartPoint] = useState('');
  const [selectedTransport, setSelectedTransport] = useState<TransportType>('transit');
  const [selectedPlanMode, setSelectedPlanMode] = useState<PlanMode>('free');
  const citiesQuery = useCitiesQuery();
  const cities = useMemo(() => (citiesQuery.data?.list ?? []).map(mapCity).filter((city): city is TravelCity => Boolean(city)), [citiesQuery.data?.list]);
  // 用户未主动切换时默认使用第一个城市；如果当前选择不在列表中，也回退到第一个城市。
  const activeCityId = cities.some((city) => city.id === selectedCityId) ? selectedCityId : cities[0]?.id;
  const cityDetailQuery = useCityDetailQuery(activeCityId);
  const tagsQuery = useCityTagsQuery(activeCityId);
  const spotsQuery = useCitySpotsQuery(activeCityId, activeFilter, searchKeyword);
  const city = useMemo(() => mapCity(cityDetailQuery.data ?? cities.find((item) => item.id === activeCityId)), [activeCityId, cities, cityDetailQuery.data]);
  const tags = useMemo(() => (tagsQuery.data ?? []).map(mapTag), [tagsQuery.data]);
  const spots = useMemo(() => (spotsQuery.data?.list ?? []).map((spot) => mapSpot(spot, city)), [city, spotsQuery.data?.list]);
  const visibleSpots = getVisibleSpots(spots, activeFilter, searchKeyword, activeRecommendTab);
  // 如果用户还未主动选择景点，或者当前选中项已被筛掉，则回退到列表首项。
  const effectiveSelectedSpotId = visibleSpots.some((spot) => spot.id === selectedSpotId) ? selectedSpotId : visibleSpots[0]?.id;
  const spotDetailQuery = useSpotDetailQuery(effectiveSelectedSpotId);
  const selectedSpot = useMemo(
    () => mergeSpotDetail(visibleSpots.find((spot) => spot.id === effectiveSelectedSpotId), spotDetailQuery.data, city),
    [city, effectiveSelectedSpotId, spotDetailQuery.data, visibleSpots],
  );
  const nearbySpots = visibleSpots.filter((spot) => spot.id !== effectiveSelectedSpotId).slice(0, 3);
  const tripSpots = tripSpotIds
    .map((spotId) => spots.find((spot) => spot.id === spotId))
    .filter((spot): spot is TravelSpot => Boolean(spot));
  const isInitialLoading = citiesQuery.isLoading || (activeCityId != null && (cityDetailQuery.isLoading || tagsQuery.isLoading || spotsQuery.isLoading));
  const pageError = citiesQuery.error ?? cityDetailQuery.error ?? tagsQuery.error ?? spotsQuery.error;

  // 加入行程时去重，避免同一个景点在路线规划池中重复出现。
  function handleAddToTrip(spotId: number) {
    setTripSpotIds((currentIds) => (currentIds.includes(spotId) ? currentIds : [...currentIds, spotId]));
  }

  // 删除行程池中的单个景点，其他景点顺序保持不变。
  function handleRemoveTripSpot(spotId: number) {
    setTripSpotIds((currentIds) => currentIds.filter((currentId) => currentId !== spotId));
  }

  // 切换城市时同步清空景点选中和行程池，避免旧城市状态残留到新城市。
  function handleCityChange(cityId: number) {
    setSelectedCityId(cityId);
    setSelectedSpotId(undefined);
    setTripSpotIds([]);
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
          description={pageError instanceof Error ? pageError.message : '暂时无法获取城市和景点数据'}
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
          onSelectSpot={setSelectedSpotId}
        />

        <div className={styles.leftFloatPanel}>
          {spots.length === 0 ? (
            <aside className={styles.inlineStatePanel}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前城市暂无景点数据" />
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

        {selectedSpot ? (
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

        <div className={styles.tripFloatPanel}>
          <TripPlannerDock
            tripSpots={tripSpots}
            transportTypes={transportTypes}
            planModes={planModes}
            startPoint={startPoint}
            selectedTransport={selectedTransport}
            selectedPlanMode={selectedPlanMode}
            onStartPointChange={setStartPoint}
            onTransportChange={setSelectedTransport}
            onPlanModeChange={setSelectedPlanMode}
            onRemoveSpot={handleRemoveTripSpot}
            onClearTrip={() => setTripSpotIds([])}
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

function mergeSpotDetail(spot: TravelSpot | undefined, detail: TravelSpotDetailDto | undefined, city?: TravelCity): TravelSpot | undefined {
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
    distanceText: spot?.distanceText ?? formatDistanceText(city, detail.position),
    tags: detail.tags.map((tag) => tag.code as SpotTagCode),
    boundary: detail.boundary,
    description: detail.description,
    travelGuide: detail.travelGuide,
  };
}

function formatDistanceText(city: TravelCity | undefined, point: { lng: number; lat: number }) {
  if (!city) {
    return '--';
  }

  const lngDelta = point.lng - city.center.lng;
  const latDelta = point.lat - city.center.lat;
  const distance = Math.sqrt(lngDelta * lngDelta + latDelta * latDelta) * 111;
  return `${distance.toFixed(1)}km`;
}
