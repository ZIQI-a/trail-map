import type { CSSProperties } from 'react';
import type { GeoPoint, TravelSpot } from '../../types/mapWorkbench';

export type MarkerPositionStyle = CSSProperties & {
  '--marker-x': string;
  '--marker-y': string;
};

// 将真实经纬度临时投影到 Mock 地图容器的百分比坐标，后续接高德地图后替换这一层。
export function getMockMarkerStyle(position: GeoPoint, spots: TravelSpot[]): MarkerPositionStyle {
  const lngValues = spots.map((spot) => spot.position.lng);
  const latValues = spots.map((spot) => spot.position.lat);
  const minLng = Math.min(...lngValues);
  const maxLng = Math.max(...lngValues);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const lngRange = maxLng - minLng || 1;
  const latRange = maxLat - minLat || 1;
  const padding = 12;
  const x = padding + ((position.lng - minLng) / lngRange) * (100 - padding * 2);
  const y = padding + ((maxLat - position.lat) / latRange) * (100 - padding * 2);

  return {
    '--marker-x': `${x}%`,
    '--marker-y': `${y}%`,
  };
}
