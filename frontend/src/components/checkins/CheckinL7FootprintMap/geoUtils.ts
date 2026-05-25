import type { CheckinFootprintCityStatDto, GeoPoint } from "../../../types/mapWorkbench";
import {
  CITY_PROVINCE_MAP,
  DEFAULT_MAP_CENTER,
  PROVINCE_COLOR_LEVELS,
} from "./constants";

/**
 * 根据城市名称推导省份名称，兼容当前后端城市数据未完全覆盖的阶段。
 */
export function resolveProvinceName(cityName: string) {
  return normalizeProvinceName(CITY_PROVINCE_MAP[cityName] ?? cityName);
}

/**
 * 根据城市行政编码推导省级行政编码，用于读取本地市级 GeoJSON。
 */
export function resolveProvinceAdcodeFromCityCode(cityCode: string) {
  return `${cityCode.slice(0, 2)}0000`;
}

/**
 * 统一省份名称格式，避免“省/市/自治区”等后缀影响统计匹配。
 */
export function normalizeProvinceName(value: string) {
  return value
    .replace(/省$/, "")
    .replace(/市$/, "")
    .replace(/自治区$/, "")
    .replace(/壮族$/, "")
    .replace(/回族$/, "")
    .replace(/维吾尔$/, "")
    .replace(/特别行政区$/, "");
}

/**
 * 统一城市名称格式，避免“成都市”和“成都”被统计成两个城市。
 */
export function normalizeCityName(value: string) {
  return value.replace(/市$/, "");
}

/**
 * 根据足迹数量返回地图分级色，颜色分级由 constants 中的映射表维护。
 */
export function resolveProvinceColor(count: number) {
  return (
    PROVINCE_COLOR_LEVELS.find((level) => count <= level.max)?.color ??
    PROVINCE_COLOR_LEVELS[0].color
  );
}

/**
 * 计算城市中心点集合的平均中心，省份缺少固定配置时作为地图中心兜底。
 */
export function resolveMapCenter(cities: CheckinFootprintCityStatDto[]): GeoPoint {
  if (cities.length === 0) {
    return DEFAULT_MAP_CENTER;
  }
  const totals = cities.reduce(
    (acc, spot) => ({
      lng: acc.lng + spot.center.lng,
      lat: acc.lat + spot.center.lat,
    }),
    { lng: 0, lat: 0 },
  );
  return {
    lng: totals.lng / cities.length,
    lat: totals.lat / cities.length,
  };
}
