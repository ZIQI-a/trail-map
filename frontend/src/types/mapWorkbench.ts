// ts用于定义子接口和相关数据类型，保证数据类型规范

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

// 出行方式：当前仅保留百度路线规划已稳定接通的几种方式。
export type TransportType = 'transit' | 'driving' | 'walking' | 'bicycling';

// 规划模式：自由路线为默认，完整行程后续再扩展。
export type PlanMode = 'free' | 'schedule';

// 行程强度：完整行程模式用于控制每天安排的松紧程度。
export type ItineraryIntensity = 'relaxed' | 'standard' | 'compact';

// 地点安排模式：用于午餐、休息、酒店等补充节点。
export type LocationArrangeMode = 'none' | 'manual' | 'recommended';

// 完整行程偏好：当前先做前端配置占位，后续再逐步接入后端编排。
export type SchedulePreferenceCode =
  | 'local_food'
  | 'night_tour'
  | 'subway_first'
  | 'family_friendly';

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
  boundary?: GeoPoint[];
  description?: string;
  travelGuide?: string;
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

// 后端统一响应结构，前端请求层按这个格式解包真实业务数据。
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

// 列表接口分页响应，兼容“分页”和“不分页”两种后端返回模式。
export interface PageResponse<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
  paged: boolean;
}

// 城市接口响应对象，对齐后端阶段 3 契约。
export interface TravelCityDto {
  id: number;
  name: string;
  provinceName: string;
  cityCode: string;
  center: GeoPoint;
  mapZoom: number;
  coverUrl: string;
  description: string;
  recommendDays: number;
  hotScore: number;
}

// 标签接口响应对象，对齐后端标签结构。
export interface SpotTagDto {
  id: number;
  name: string;
  code: SpotTagCode;
  type: string;
  sortOrder: number;
}

// 景点列表接口响应对象。
export interface TravelSpotSummaryDto {
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
  hotScore: number;
  free: boolean;
  indoor: boolean;
  night: boolean;
  rainyDay: boolean;
  subwayFriendly: boolean;
  firstVisit: boolean;
  tags: SpotTagDto[];
}

// 景点详情接口响应对象，在列表字段基础上补充详情内容。
export interface TravelSpotDetailDto extends TravelSpotSummaryDto {
  amapPoiId: string;
  boundary: GeoPoint[];
  description: string;
  travelGuide: string;
  suitableCrowd: string;
}

// 起点候选项：复用百度地点检索结果，优先给行程规划起点做名称转坐标。
export interface PoiCalibrationCandidateDto {
  name: string;
  uid: string;
  address: string;
  province: string;
  city: string;
  area: string;
  location: GeoPoint | null;
  naviLocation: GeoPoint | null;
  detailUrl: string;
  sourceProvider: string;
}

// 路线规划起终点：既可表示酒店，也可表示用户手动输入的出发地。
export interface RouteLocation {
  name: string;
  position: GeoPoint;
  address?: string;
}

// 行程规划请求：自由路线和完整行程共用一套结构，完整模式再补时间偏好。
export interface RoutePlanRequestDto {
  cityId: number;
  startPoint: RouteLocation;
  endPoint?: RouteLocation;
  spotIds: number[];
  transportType: TransportType;
  planMode: PlanMode;
  orderMode?: 'smart' | 'manual';
  travelDate?: string;
  tripDays?: number;
  dailyStartTime?: string;
  dailyEndTime?: string;
  includeLunchBreak?: boolean;
  includeNightTour?: boolean;
  intensity?: ItineraryIntensity;
  lunchMode?: LocationArrangeMode;
  lunchLocation?: RouteLocation;
  restMode?: LocationArrangeMode;
  restLocation?: RouteLocation;
  hotelMode?: LocationArrangeMode;
  hotelLocation?: RouteLocation;
  returnToHotel?: boolean;
}

// 完整行程配置：规划前弹窗和结果页设置抽屉共用这一套前端状态。
export interface SchedulePlanConfig {
  tripStartDate: string;
  tripDays: number;
  travelerCount: number;
  dailyStartTime: string;
  dailyEndTime: string;
  includeLunchBreak: boolean;
  includeNightTour: boolean;
  intensity: ItineraryIntensity;
  lunchMode: LocationArrangeMode;
  lunchPlaceName: string;
  restMode: LocationArrangeMode;
  restPlaceName: string;
  hotelMode: LocationArrangeMode;
  hotelName: string;
  returnToHotel: boolean;
  preferenceTags: SchedulePreferenceCode[];
}

// 停留安排：既给自由路线展示建议游玩时间，也为完整模式的时间编排提供基础。
export interface RouteSpotStayPlanDto {
  spotId: number;
  spotName: string;
  suggestedDurationMinutes: number;
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  dayIndex?: number;
}

// 单段路线：承接百度路线规划结果，保留每一段的距离、耗时和说明。
export interface RouteSegmentDto {
  segmentIndex: number;
  fromName: string;
  fromPosition: GeoPoint;
  toName: string;
  toPosition: GeoPoint;
  transportType: TransportType;
  distanceMeters: number;
  durationSeconds: number;
  instruction: string;
  polyline: GeoPoint[];
  stepTexts: string[];
}

// 每日行程：完整行程模式用于展示 Day 1 / Day 2，MVP 自由路线可先返回空数组。
export interface ItineraryDayDto {
  dayIndex: number;
  title: string;
  startTime: string;
  startPlaceName: string;
  totalDistanceMeters: number;
  totalTravelDurationSeconds: number;
  totalStayDurationMinutes: number;
  totalTripDurationMinutes: number;
  spots: RouteSpotStayPlanDto[];
  items: ItineraryItemDto[];
  segments: RouteSegmentDto[];
}

// 完整行程时间轴节点：用于展示景点、午餐、休息、酒店等混合结果。
export interface ItineraryItemDto {
  sequence: number;
  itemType: 'spot' | 'lunch' | 'rest' | 'hotel';
  title: string;
  placeName: string;
  placeType: string;
  position?: GeoPoint | null;
  durationMinutes: number;
  suggestedStartTime: string;
  suggestedEndTime: string;
  relatedSpotId?: number;
  note?: string;
}

// 行程规划响应：既包含路线分段，也包含景点停留时间和总时间汇总。
export interface RoutePlanResponseDto {
  routeRecordId?: number;
  cityId: number;
  transportType: TransportType;
  planMode: PlanMode;
  routeSummary: string;
  orderedSpotIds: number[];
  totalDistanceMeters: number;
  totalTravelDurationSeconds: number;
  totalStayDurationMinutes: number;
  totalTripDurationMinutes: number;
  spotStayPlans: RouteSpotStayPlanDto[];
  segments: RouteSegmentDto[];
  itineraryDays: ItineraryDayDto[];
}
