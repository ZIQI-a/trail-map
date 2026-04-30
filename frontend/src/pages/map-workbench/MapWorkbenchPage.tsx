import { useState } from 'react';
import { MockMapStage } from '../../components/map-workbench/MockMapStage';
import { SpotDetailPanel } from '../../components/map-workbench/SpotDetailPanel';
import { SpotRecommendList, type RecommendTab } from '../../components/map-workbench/SpotRecommendList';
import { TripPlannerDock } from '../../components/map-workbench/TripPlannerDock';
import { WorkbenchHeader, type ActiveSpotFilter } from '../../components/map-workbench/WorkbenchHeader';
import { chengduWorkbenchData } from '../../mocks/map-workbench';
import type { PlanMode, TransportType, TravelSpot } from '../../types/mapWorkbench';
import { getVisibleSpots } from '../../utils/map-workbench/spotFilters';
import styles from './MapWorkbenchPage.module.css';

// MapWorkbenchPage 是地图工作台页面入口，只组织页面布局和跨组件共享状态。
export function MapWorkbenchPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveSpotFilter>('all');
  const [activeRecommendTab, setActiveRecommendTab] = useState<RecommendTab>('recommend');
  const [selectedSpotId, setSelectedSpotId] = useState<number>();
  const [tripSpotIds, setTripSpotIds] = useState<number[]>([]);
  const [startPoint, setStartPoint] = useState('');
  const [selectedTransport, setSelectedTransport] = useState<TransportType>('transit');
  const [selectedPlanMode, setSelectedPlanMode] = useState<PlanMode>('free');
  const { city, tags, spots, areas, transportTypes, planModes } = chengduWorkbenchData;
  const visibleSpots = getVisibleSpots(spots, activeFilter, searchKeyword, activeRecommendTab);
  const selectedSpot = visibleSpots.find((spot) => spot.id === selectedSpotId);
  const nearbySpots = spots.filter((spot) => spot.id !== selectedSpotId).slice(0, 3);
  const tripSpots = tripSpotIds
    .map((spotId) => spots.find((spot) => spot.id === spotId))
    .filter((spot): spot is TravelSpot => Boolean(spot));

  // 加入行程时去重，避免同一个景点在路线规划池中重复出现。
  function handleAddToTrip(spotId: number) {
    setTripSpotIds((currentIds) => (currentIds.includes(spotId) ? currentIds : [...currentIds, spotId]));
  }

  // 删除行程池中的单个景点，其他景点顺序保持不变。
  function handleRemoveTripSpot(spotId: number) {
    setTripSpotIds((currentIds) => currentIds.filter((currentId) => currentId !== spotId));
  }

  return (
    <main className={styles.workbenchShell}>
      <WorkbenchHeader
        cityName={city.name}
        tags={tags}
        searchKeyword={searchKeyword}
        activeFilter={activeFilter}
        onSearchKeywordChange={setSearchKeyword}
        onActiveFilterChange={setActiveFilter}
      />

      <section className={styles.mapWorkspace} aria-label="地图工作台主体">
        <MockMapStage
          cityName={city.name}
          spots={visibleSpots}
          areaNames={areas.map((area) => area.name)}
          selectedSpotId={selectedSpotId}
          onSelectSpot={setSelectedSpotId}
        />

        <div className={styles.leftFloatPanel}>
          <SpotRecommendList
            spots={visibleSpots}
            tags={tags}
            activeTab={activeRecommendTab}
            selectedSpotId={selectedSpotId}
            onActiveTabChange={setActiveRecommendTab}
            onSelectSpot={setSelectedSpotId}
          />
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
