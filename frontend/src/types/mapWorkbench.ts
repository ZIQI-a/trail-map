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

// 收藏状态接口响应对象，供详情面板收藏按钮使用。
export interface FavoriteSpotStatusDto {
  favorited: boolean;
}

// 打卡状态接口响应对象，供景点详情和足迹页状态展示。
export interface CheckinSpotStatusDto {
  checkedIn: boolean;
  checkedInAt: string | null;
  remark: string | null;
}

// 个人主页概览统计，对齐后端 /api/profile/overview。
export interface UserProfileOverviewDto {
  visitedCityCount: number;
  favoriteSpotCount: number;
  checkinSpotCount: number;
  tripCount: number;
  totalTravelDays: number;
  recentCityName?: string | null;
}

// 我的收藏景点列表项，对齐后端收藏页接口结构。
export interface FavoriteSpotItemDto {
  favoriteId: number;
  spotId: number;
  cityId: number;
  cityName: string;
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
  favoritedAt: string;
  tags: SpotTagDto[];
}

// 我的打卡景点列表项，对齐后端“我的足迹”接口结构。
export interface CheckinSpotItemDto {
  checkinId: number;
  spotId: number;
  cityId: number;
  cityName: string;
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
  checkedInAt: string;
  checkinPosition: GeoPoint | null;
  remark: string | null;
  tags: SpotTagDto[];
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
  tripEndDate: string;
  tripDays: number;
  travelerCount: number;
  dailyStartTime: string;
  dailyEndTime: string;
  includeLunchBreak: boolean;
  includeNightTour: boolean;
  intensity: ItineraryIntensity;
  lunchMode: LocationArrangeMode;
  lunchPlaceName: string;
  lunchLocation?: RouteLocation;
  restMode: LocationArrangeMode;
  restPlaceName: string;
  restLocation?: RouteLocation;
  hotelMode: LocationArrangeMode;
  hotelName: string;
  hotelLocation?: RouteLocation;
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

// 保存行程时复用规划结果中的坐标结构，保持前后端字段口径一致。
export interface SaveTripCoordinateDto {
  lng: number;
  lat: number;
}

// 保存行程的节点请求结构，覆盖景点和午餐/酒店等补充节点。
export interface SaveTripItemRequestDto {
  spotId?: number;
  itemName: string;
  itemType: 'spot' | 'lunch' | 'rest' | 'hotel';
  position?: SaveTripCoordinateDto;
  dayIndex: number;
  sortOrder: number;
  startTime?: string;
  endTime?: string;
  suggestedDuration?: number;
}

// 保存行程时同步落库路线段，便于后续详情回放和管理端查看。
export interface SaveTripSegmentRequestDto {
  dayIndex: number;
  segmentIndex: number;
  fromName: string;
  fromPosition: SaveTripCoordinateDto;
  toName: string;
  toPosition: SaveTripCoordinateDto;
  transportType: TransportType;
  distance: number;
  duration: number;
  instruction: string;
  polyline: SaveTripCoordinateDto[];
  steps: string[];
}

// 保存行程请求对象，对齐后端 SaveTripRequest。
export interface SaveTripRequestDto {
  cityId: number;
  tripName: string;
  startName?: string;
  endName?: string;
  startPosition?: SaveTripCoordinateDto;
  endPosition?: SaveTripCoordinateDto;
  startDate?: string;
  endDate?: string;
  days: number;
  transportType: TransportType;
  planMode: PlanMode;
  totalDistance?: number;
  totalTravelDuration?: number;
  totalStayDuration?: number;
  totalTripDuration?: number;
  routeSummary?: string;
  routeRecordId?: number;
  coverUrl?: string;
  items: SaveTripItemRequestDto[];
  segments?: SaveTripSegmentRequestDto[];
}

// 我的行程列表项，对齐后端 TripSummaryResponse。
export interface UserTripSummaryDto {
  id: number;
  cityId: number;
  cityName: string;
  tripName: string;
  startName?: string | null;
  endName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  days: number;
  transportType: TransportType;
  planMode: PlanMode;
  totalDistance: number;
  totalDuration: number;
  coverUrl?: string | null;
  isPublic?: boolean;
  shareToken?: string | null;
  createdAt: string;
}

// 我的行程详情节点，对齐后端完整节点返回。
export interface UserTripItemDetailDto {
  spotId?: number | null;
  itemType: 'spot' | 'lunch' | 'rest' | 'hotel';
  itemName: string;
  coverUrl?: string | null;
  lng?: number | null;
  lat?: number | null;
  sortOrder: number;
  suggestedDuration?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

// 兼容旧展示的景点明细。
export interface UserTripSpotDetailDto {
  spotId?: number | null;
  spotName: string;
  coverUrl?: string | null;
  sortOrder: number;
  suggestedDuration?: number | null;
}

export interface UserTripDayDetailDto {
  dayIndex: number;
  spots: UserTripSpotDetailDto[];
  items: UserTripItemDetailDto[];
}

// 我的行程详情里的路线段，对齐后端 TripDetailResponse.RouteSegmentResponse。
export interface UserTripRouteSegmentDetailDto {
  dayIndex: number;
  segmentIndex: number;
  fromName: string;
  fromLng?: number | null;
  fromLat?: number | null;
  fromPosition?: SaveTripCoordinateDto | null;
  toName: string;
  toLng?: number | null;
  toLat?: number | null;
  toPosition?: SaveTripCoordinateDto | null;
  transportType: TransportType;
  distance: number;
  duration: number;
  instruction: string;
  polyline: string; // JSON string
  stepsJson: string; // JSON string
}

// 我的行程详情对象，对齐后端 TripDetailResponse。
export interface UserTripDetailDto {
  id: number;
  cityId: number;
  cityName: string;
  tripName: string;
  startName?: string | null;
  endName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  days: number;
  transportType: TransportType;
  planMode: PlanMode;
  totalDistance: number;
  totalDuration: number;
  routeRecordId?: number | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  shareToken?: string | null;
  createdAt: string;
  itineraryDays: UserTripDayDetailDto[];
  routeSegments: UserTripRouteSegmentDetailDto[];
}

// 行程公开分享状态响应。
export interface TripShareDto {
  tripId: number;
  isPublic: boolean;
  shareToken?: string | null;
}
