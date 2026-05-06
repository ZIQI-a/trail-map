import type { GeoPoint } from '../../types/mapWorkbench';

const X_PI = (Math.PI * 3000.0) / 180.0;

// 将 GCJ-02 坐标转换为百度地图使用的 BD-09 坐标，修正百度底图点位偏移。
export function gcj02ToBd09(point: GeoPoint): GeoPoint {
  const z = Math.sqrt(point.lng * point.lng + point.lat * point.lat) + 0.00002 * Math.sin(point.lat * X_PI);
  const theta = Math.atan2(point.lat, point.lng) + 0.000003 * Math.cos(point.lng * X_PI);

  return {
    lng: z * Math.cos(theta) + 0.0065,
    lat: z * Math.sin(theta) + 0.006,
  };
}
