import type { AppUserDto } from "./auth";
import type { GeoPoint, PageResponse, SpotType, TravelCityDto } from "./mapWorkbench";

// 管理端城市表单：当前复用城市基础资料字段，便于后台做简单维护。
export interface AdminCityFormDto {
  cityName: string;
  provinceName: string;
  cityCode: string;
  centerLng: number;
  centerLat: number;
  mapZoom: number;
  coverUrl?: string | null;
  description?: string | null;
  recommendDays?: number | null;
  hotScore?: number | null;
  sortOrder?: number | null;
  status?: number | null;
}

// 管理端城市候选同时携带省市归属，表单只需要一个组合搜索字段。
export interface AdminCityOptionDto {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
}

export interface AdminCityLocationDto {
  cityName: string;
  provinceName: string;
  cityCode: string;
  center: GeoPoint;
}

// 管理端城市详情：在工作台城市字段基础上补齐后台编辑需要的排序和状态。
export interface AdminCityDto extends TravelCityDto {
  sortOrder?: number | null;
  status: number;
}

// 管理端景点详情：比工作台列表多返回基础维护和开关字段。
export interface AdminSpotDto {
  id: number;
  cityId: number;
  cityName: string;
  name: string;
  type: SpotType;
  position: GeoPoint;
  address: string;
  amapPoiId?: string | null;
  boundaryGeojson?: string | null;
  coverUrl?: string | null;
  summary?: string | null;
  description?: string | null;
  recommendReason?: string | null;
  travelGuide?: string | null;
  openingHours?: string | null;
  ticketInfo?: string | null;
  suggestedDurationMinutes?: number | null;
  bestTime?: string | null;
  recommendScore?: number | null;
  hotScore?: number | null;
  suitableCrowd?: string | null;
  free: boolean;
  indoor: boolean;
  night: boolean;
  rainyDay: boolean;
  subwayFriendly: boolean;
  firstVisit: boolean;
  sortOrder?: number | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 管理端景点表单：和后端管理接口保持字段对齐，方便弹窗直接提交。
export interface AdminSpotFormDto {
  cityId: number;
  spotName: string;
  spotType: SpotType;
  lng: number;
  lat: number;
  address: string;
  amapPoiId?: string | null;
  boundaryGeojson?: string | null;
  coverUrl?: string | null;
  summary?: string | null;
  description?: string | null;
  recommendReason?: string | null;
  travelGuide?: string | null;
  openingHours?: string | null;
  ticketInfo?: string | null;
  suggestedDuration?: number | null;
  bestTime?: string | null;
  recommendScore?: number | null;
  hotScore?: number | null;
  suitableCrowd?: string | null;
  isFree?: number;
  isIndoor?: number;
  isNight?: number;
  isRainyDay?: number;
  subwayFriendly?: number;
  firstVisit?: number;
  sortOrder?: number | null;
  status?: number | null;
}

export type AdminCityListDto = PageResponse<AdminCityDto>;
export type AdminSpotListDto = PageResponse<AdminSpotDto>;

export interface AdminOverviewDimensionDto {
  code: string;
  label: string;
  value: number;
}

export interface AdminOverviewMetricDto {
  totalUsers: number;
  normalUsers: number;
  memberUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  totalCities: number;
  enabledCities: number;
  disabledCities: number;
  totalSpots: number;
  enabledSpots: number;
  disabledSpots: number;
  missingCoverSpots: number;
  missingScoreSpots: number;
}

export interface AdminOverviewRecentSpotDto {
  id: number;
  name: string;
  cityName: string;
  type: SpotType;
  status: number;
  updatedAt: string;
}

export interface AdminOverviewDto {
  metrics: AdminOverviewMetricDto;
  userRoleDistribution: AdminOverviewDimensionDto[];
  spotTypeDistribution: AdminOverviewDimensionDto[];
  citySpotRanking: AdminOverviewDimensionDto[];
  dataStatusDistribution: AdminOverviewDimensionDto[];
  recentUsers: AppUserDto[];
  recentSpots: AdminOverviewRecentSpotDto[];
}
