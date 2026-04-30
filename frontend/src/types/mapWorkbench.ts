// 地理坐标类型：前端地图、景点和城市中心点共用。
export interface GeoPoint {
  lng: number;
  lat: number;
}

// 景点类型：先与数据库 spot_type 草案保持一致，后续可与后端枚举对齐。
export type SpotType =
  | 'history'
  | 'nature'
  | 'landmark'
  | 'museum'
  | 'food'
  | 'night'
  | 'family'
  | 'business';

// 标签编码：用于前端筛选按钮和景点标签展示。
export type SpotTagCode =
  | 'first_visit'
  | 'photo'
  | 'night_tour'
  | 'family'
  | 'couple'
  | 'free'
  | 'indoor'
  | 'rainy_day'
  | 'half_day'
  | 'subway';

// 出行方式：先覆盖路线规划 MVP 需要的基础方式。
export type TransportType = 'transit' | 'driving' | 'walking' | 'bicycling' | 'taxi';

// 规划模式：自由路线为默认，完整行程后续再扩展。
export type PlanMode = 'free' | 'schedule';

// 城市信息：字段贴近 city 表，但只保留前端静态展示阶段需要的内容。
export interface TravelCity {
  id: number;
  name: string;
  provinceName: string;
  cityCode: string;
  center: GeoPoint;
  mapZoom: number;
  description: string;
  recommendDays: number;
}

// 景点标签：用于分类筛选和景点卡片标签。
export interface SpotTag {
  id: number;
  name: string;
  code: SpotTagCode;
  sortOrder: number;
}

// 景点信息：字段来自 spot 表的前端子集，后续可映射后端接口响应。
export interface TravelSpot {
  id: number;
  cityId: number;
  name: string;
  type: SpotType;
  position: GeoPoint;
  address: string;
  coverUrl: string;
  summary: string;
  recommendReason: string;
  openingHours: string;
  ticketInfo: string;
  suggestedDurationMinutes: number;
  bestTime: string;
  recommendScore: number;
  distanceText: string;
  tags: SpotTagCode[];
}

// 城市热门区域：后续用于低缩放层级展示区域聚合。
export interface TravelArea {
  id: number;
  cityId: number;
  name: string;
  center: GeoPoint;
  summary: string;
  suggestedDurationMinutes: number;
  spotIds: number[];
}

// 地图工作台 Mock 数据集合，方便页面一次性导入。
export interface MapWorkbenchMockData {
  city: TravelCity;
  tags: SpotTag[];
  spots: TravelSpot[];
  areas: TravelArea[];
  transportTypes: Array<{
    label: string;
    value: TransportType;
  }>;
  planModes: Array<{
    label: string;
    value: PlanMode;
  }>;
}
