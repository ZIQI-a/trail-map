import type {
  CheckinFootprintCityStatDto,
  CheckinFootprintProvinceStatDto,
  GeoPoint,
} from "../../../types/mapWorkbench";

export type FootprintMapMode = "country" | "province";

// GeoJSON 属性扩展字段，承载 L7 渲染需要的颜色、数量和状态文案。
export interface ProvinceFeatureProperties {
  adcode?: number;
  center?: [number, number];
  centroid?: [number, number];
  cityCount: number;
  color: string;
  count: number;
  name: string;
  statusText: string;
  [key: string]: unknown;
}

// 单个省份或城市边界要素，当前只处理 Polygon/MultiPolygon 边界。
export interface ProvinceFeature {
  geometry: {
    coordinates: unknown;
    type: "Polygon" | "MultiPolygon";
  };
  properties: ProvinceFeatureProperties;
  type: "Feature";
}

// L7 面图层读取的 GeoJSON 集合结构。
export interface ProvinceFeatureCollection {
  features: ProvinceFeature[];
  type: "FeatureCollection";
}

// 全国视图按省份聚合后的统计结果。
export interface ProvinceStatistic {
  cityCount: number;
  count: number;
}

// 省份视图按城市聚合后的统计结果。
export interface CityStatistic {
  count: number;
  position: GeoPoint;
}

// 足迹地图的聚合输入结构，统一承接后端统计结果。
export interface FootprintStatisticBundle {
  cities: CheckinFootprintCityStatDto[];
  provinces: CheckinFootprintProvinceStatDto[];
  totalCheckinCount: number;
  unlockedProvinceCount: number;
}

// 省份视图的固定视口配置，避免部分省份自动居中效果不稳定。
export interface ProvinceViewConfig {
  center: [number, number];
  zoom: number;
}
