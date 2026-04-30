import { Button } from 'antd';
import type { TravelSpot } from '../../../types/mapWorkbench';
import { getMockMarkerStyle } from '../../../utils/map-workbench/mockMapProjection';
import styles from './MockMapStage.module.css';

const spotTypeLabelMap: Record<TravelSpot['type'], string> = {
  history: '历史',
  nature: '自然',
  landmark: '地标',
  museum: '博物馆',
  food: '美食',
  night: '夜游',
  family: '亲子',
  business: '商圈',
};

interface MockMapStageProps {
  cityName: string;
  spots: TravelSpot[];
  areaNames: string[];
  selectedSpotId?: number;
  onSelectSpot: (spotId: number) => void;
}

// MockMapStage 用纯前端元素模拟地图和点位，不加载任何第三方地图 SDK。
export function MockMapStage({ cityName, spots, areaNames, selectedSpotId, onSelectSpot }: MockMapStageProps) {
  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId);

  return (
    <section className={styles.mapStage} aria-label={`${cityName} Mock 地图`}>
      <div className={styles.mockMapToolbar}>
        <div>
          <p className={styles.panelLabel}>中心区域</p>
          <h1>{cityName}景点分布</h1>
        </div>
        <span className={styles.mockBadge}>Mock Map</span>
      </div>

      <div className={styles.mockMapCanvas}>
        <div className={styles.mockRoadPrimary} />
        <div className={styles.mockRoadSecondary} />
        <div className={styles.mockRiver} />

        <div className={styles.areaLayer} aria-label="热门区域">
          {areaNames.map((areaName) => (
            <span className={styles.areaPill} key={areaName}>
              {areaName}
            </span>
          ))}
        </div>

        {spots.map((spot) => {
          const isSelected = spot.id === selectedSpotId;

          return (
            <Button
              className={isSelected ? styles.spotMarkerActive : styles.spotMarker}
              type="text"
              key={spot.id}
              style={getMockMarkerStyle(spot.position, spots)}
              aria-pressed={isSelected}
              onClick={() => onSelectSpot(spot.id)}
            >
              <span className={styles.markerDot}>{spotTypeLabelMap[spot.type]}</span>
              <span className={styles.markerName}>{spot.name}</span>
            </Button>
          );
        })}
      </div>

      <footer className={styles.mockMapStatus}>
        <span>已加载 {spots.length} 个 Mock 点位</span>
        <span>当前选中：{selectedSpot?.name ?? '暂无'}</span>
      </footer>
    </section>
  );
}
