import type { GeoPoint } from '../../types/mapWorkbench';

const X_PI = (Math.PI * 3000.0) / 180.0;
const PI = Math.PI;
const A = 6378245.0;
const EE = Number("0.00669342162296594323");

// 将 GCJ-02 坐标转换为百度地图使用的 BD-09 坐标，修正百度底图点位偏移。
export function gcj02ToBd09(point: GeoPoint): GeoPoint {
  const z = Math.sqrt(point.lng * point.lng + point.lat * point.lat) + 0.00002 * Math.sin(point.lat * X_PI);
  const theta = Math.atan2(point.lat, point.lng) + 0.000003 * Math.cos(point.lng * X_PI);

  return {
    lng: z * Math.cos(theta) + 0.0065,
    lat: z * Math.sin(theta) + 0.006,
  };
}

// 百度地图点击事件返回 BD-09 坐标，回填到业务状态前转回项目统一使用的 GCJ-02。
export function bd09ToGcj02(point: GeoPoint): GeoPoint {
  const x = point.lng - 0.0065;
  const y = point.lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);

  return {
    lng: z * Math.cos(theta),
    lat: z * Math.sin(theta),
  };
}

// 浏览器定位返回 WGS-84，这里转成项目当前统一使用的 GCJ-02。
export function wgs84ToGcj02(point: GeoPoint): GeoPoint {
  if (outOfChina(point)) {
    return point;
  }

  let dLat = transformLat(point.lng - 105.0, point.lat - 35.0);
  let dLng = transformLng(point.lng - 105.0, point.lat - 35.0);
  const radLat = (point.lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);

  return {
    lng: point.lng + dLng,
    lat: point.lat + dLat,
  };
}

function outOfChina(point: GeoPoint) {
  return point.lng < 72.004 || point.lng > 137.8347 || point.lat < 0.8293 || point.lat > 55.8271;
}

function transformLat(lng: number, lat: number) {
  let result = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  result += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
  result += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
  return result;
}

function transformLng(lng: number, lat: number) {
  let result = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  result += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
  result += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
  return result;
}
