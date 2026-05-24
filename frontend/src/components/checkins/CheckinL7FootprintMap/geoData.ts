import type { CheckinSpotItemDto } from "../../../types/mapWorkbench";
import { resolveProvinceColor } from "./geoUtils";
import { normalizeCityName, normalizeProvinceName, resolveProvinceName } from "./geoUtils";
import type {
  CityStatistic,
  ProvinceFeatureCollection,
  ProvinceStatistic,
} from "./types";

/**
 * 按省份汇总足迹数量和覆盖城市数，用于全国视图分级着色。
 */
export function buildProvinceStats(spots: CheckinSpotItemDto[]) {
  return spots.reduce((stats, spot) => {
    const provinceName = resolveProvinceName(spot.cityName);
    const current = stats.get(provinceName) ?? {
      cityNames: new Set<string>(),
      count: 0,
    };
    current.count += 1;
    current.cityNames.add(spot.cityName);
    stats.set(provinceName, current);
    return stats;
  }, new Map<string, ProvinceStatistic>());
}

/**
 * 按城市汇总足迹数量和一个代表坐标，用于省份视图的城市聚合点。
 */
export function buildCityStats(spots: CheckinSpotItemDto[]) {
  return spots.reduce((stats, spot) => {
    const cityName = normalizeCityName(spot.cityName);
    const current = stats.get(cityName) ?? {
      count: 0,
      firstSpotId: spot.spotId,
      position: spot.position,
    };
    current.count += 1;
    stats.set(cityName, current);
    return stats;
  }, new Map<string, CityStatistic>());
}

/**
 * 将省份统计信息合并到全国 GeoJSON 属性中，供 L7 PolygonLayer 使用。
 */
export function buildProvinceFeatureCollection(
  provinceStats: Map<string, ProvinceStatistic>,
  chinaGeoJson: ProvinceFeatureCollection,
): ProvinceFeatureCollection {
  return {
    type: "FeatureCollection",
    features: chinaGeoJson.features.map((feature) => {
      const provinceName = normalizeProvinceName(feature.properties.name);
      const stat = provinceStats.get(provinceName);
      const count = stat?.count ?? 0;
      return {
        ...feature,
        type: "Feature",
        properties: {
          ...feature.properties,
          cityCount: stat?.cityNames.size ?? 0,
          color: resolveProvinceColor(count),
          count,
          name: provinceName,
          statusText: count > 0 ? `${count} 个足迹` : "未解锁",
        },
      };
    }),
  };
}

/**
 * 将城市统计信息合并到省内市级 GeoJSON 属性中，供省份视图绘制城市板块。
 */
export function buildCityFeatureCollection(
  cityStats: Map<string, CityStatistic>,
  cityGeoJson: ProvinceFeatureCollection,
): ProvinceFeatureCollection {
  return {
    type: "FeatureCollection",
    features: cityGeoJson.features.map((feature) => {
      const cityName = normalizeCityName(feature.properties.name);
      const stat = cityStats.get(cityName);
      const count = stat?.count ?? 0;
      return {
        ...feature,
        type: "Feature",
        properties: {
          ...feature.properties,
          color: resolveProvinceColor(count),
          count,
          name: cityName,
          statusText: count > 0 ? `${count} 条足迹` : "未打卡",
        },
      };
    }),
  };
}

/**
 * 生成省份名称标签数据，未解锁省份的锁图标合并在文字中避免图标重叠。
 */
export function buildProvinceLabelData(
  provinceStats: Map<string, ProvinceStatistic>,
  provinceGeoJson: ProvinceFeatureCollection,
) {
  return provinceGeoJson.features.map((feature) => {
    const provinceName = normalizeProvinceName(feature.properties.name);
    const count = provinceStats.get(provinceName)?.count ?? 0;
    const labelPoint = feature.properties.centroid ?? feature.properties.center;
    return {
      name: provinceName,
      labelText: count > 0 ? provinceName : `🔒\n${provinceName}`,
      count,
      iconSize: 12,
      statusColor: resolveProvinceColor(count),
      labelColor: count > 0 ? "#eaf4ff" : "#8090a7",
      lat: labelPoint?.[1] ?? 35.8,
      lng: labelPoint?.[0] ?? 104.6,
    };
  });
}

/**
 * 生成城市名称和数量标签数据，用于省份视图的城市板块标注。
 */
export function buildCityLabelData(
  cityStats: Map<string, CityStatistic>,
  cityGeoJson: ProvinceFeatureCollection,
) {
  return cityGeoJson.features.map((feature) => {
    const cityName = normalizeCityName(feature.properties.name);
    const count = cityStats.get(cityName)?.count ?? 0;
    const labelPoint = feature.properties.centroid ?? feature.properties.center;
    return {
      name: cityName,
      labelText: count > 0 ? `${cityName}\n${count}` : cityName,
      count,
      pointSize: count > 0 ? Math.min(18, 10 + count * 2) : 0,
      statusColor: resolveProvinceColor(count),
      labelColor: count > 0 ? "#eaf4ff" : "#8090a7",
      lat: labelPoint?.[1] ?? 35.8,
      lng: labelPoint?.[0] ?? 104.6,
    };
  });
}
