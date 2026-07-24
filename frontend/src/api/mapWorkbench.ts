import { request } from '../lib/http';
import type {
  PageResponse,
  CheckinSpotItemDto,
  CheckinFootprintDto,
  CheckinSpotStatusDto,
  FavoriteSpotStatusDto,
  FavoriteSpotItemDto,
  PoiCalibrationCandidateDto,
  RoutePlanRequestDto,
  RoutePlanResponseDto,
  SaveTripRequestDto,
  SpotTagDto,
  TripShareDto,
  UpdateTripNameRequestDto,
  TravelCityDto,
  TravelSpotDetailDto,
  TravelSpotSummaryDto,
  UserProfileOverviewDto,
  UserTripDetailDto,
  UserTripSummaryDto,
} from '../types/mapWorkbench';

// 获取全部已启用城市，供地图工作台动态生成快捷选择和省市分组。
export function fetchCities() {
  return request<PageResponse<TravelCityDto>>('/api/cities');
}

// 获取单个城市详情，用于页面初始化城市中心点和基础文案。
export function fetchCity(cityId: number) {
  return request<TravelCityDto>(`/api/cities/${cityId}`);
}

// 获取当前城市可用的景点标签。
export function fetchCityTags(cityId: number) {
  return request<SpotTagDto[]>(`/api/cities/${cityId}/tags`);
}

// 获取全量景点标签。
export function fetchAllTags() {
  return request<SpotTagDto[]>('/api/tags');
}

// 获取当前城市景点列表，支持关键词和标签等筛选。
export function fetchCitySpots(cityId: number, params?: { keyword?: string; type?: string; tagCode?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.keyword) {
    searchParams.set('keyword', params.keyword);
  }
  if (params?.type) {
    searchParams.set('type', params.type);
  }
  if (params?.tagCode) {
    searchParams.set('tagCode', params.tagCode);
  }

  const queryString = searchParams.toString();
  return request<PageResponse<TravelSpotSummaryDto>>(`/api/cities/${cityId}/spots${queryString ? `?${queryString}` : ''}`);
}

// 获取景点详情，在右侧详情面板选中景点时请求。
export function fetchSpotDetail(spotId: number) {
  return request<TravelSpotDetailDto>(`/api/spots/${spotId}`);
}

// 获取当前登录用户对指定景点的收藏状态。
export function fetchFavoriteSpotStatus(spotId: number) {
  return request<FavoriteSpotStatusDto>(`/api/favorite-spots/${spotId}/status`);
}

// 收藏指定景点，成功后返回最新收藏状态。
export function favoriteSpot(spotId: number) {
  return request<FavoriteSpotStatusDto>(`/api/favorite-spots/${spotId}`, {
    method: 'POST',
  });
}

// 取消收藏指定景点，成功后返回最新收藏状态。
export function unfavoriteSpot(spotId: number) {
  return request<FavoriteSpotStatusDto>(`/api/favorite-spots/${spotId}`, {
    method: 'DELETE',
  });
}

// 获取当前登录用户的收藏景点列表，筛选、排序和分页统一交给后端处理。
export function fetchFavoriteSpots(params?: {
  tagCode?: string;
  cityName?: string;
  favoritedWithinDays?: number;
  sortBy?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.tagCode) {
    searchParams.set('tagCode', params.tagCode);
  }
  if (params?.cityName) {
    searchParams.set('cityName', params.cityName);
  }
  if (params?.favoritedWithinDays) {
    searchParams.set('favoritedWithinDays', String(params.favoritedWithinDays));
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params?.pageNum) {
    searchParams.set('pageNum', String(params.pageNum));
  }
  if (params?.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }
  const queryString = searchParams.toString();
  return request<PageResponse<FavoriteSpotItemDto>>(`/api/favorite-spots${queryString ? `?${queryString}` : ''}`);
}

// 获取当前登录用户对指定景点的打卡状态。
export function fetchCheckinSpotStatus(spotId: number) {
  return request<CheckinSpotStatusDto>(`/api/checkin-spots/${spotId}/status`);
}

// 打卡指定景点，备注和坐标为可选信息。
export function checkinSpot(spotId: number, payload?: { checkinLng?: number; checkinLat?: number; remark?: string }) {
  return request<CheckinSpotStatusDto>(`/api/checkin-spots/${spotId}`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
}

// 取消指定景点打卡。
export function uncheckinSpot(spotId: number) {
  return request<CheckinSpotStatusDto>(`/api/checkin-spots/${spotId}`, {
    method: 'DELETE',
  });
}

// 获取当前登录用户的打卡景点列表，筛选、排序和分页统一交给后端处理。
export function fetchCheckinSpots(params?: {
  tagCode?: string;
  cityName?: string;
  checkedInWithinDays?: number;
  sortBy?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.tagCode) {
    searchParams.set('tagCode', params.tagCode);
  }
  if (params?.cityName) {
    searchParams.set('cityName', params.cityName);
  }
  if (params?.checkedInWithinDays) {
    searchParams.set('checkedInWithinDays', String(params.checkedInWithinDays));
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params?.pageNum) {
    searchParams.set('pageNum', String(params.pageNum));
  }
  if (params?.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }
  const queryString = searchParams.toString();
  return request<PageResponse<CheckinSpotItemDto>>(`/api/checkin-spots${queryString ? `?${queryString}` : ''}`);
}

// 获取当前登录用户的足迹地图聚合统计，供全国/省份足迹地图直接渲染。
export function fetchCheckinFootprint(params?: {
  tagCode?: string;
  cityName?: string;
  checkedInWithinDays?: number;
  sortBy?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.tagCode) {
    searchParams.set('tagCode', params.tagCode);
  }
  if (params?.cityName) {
    searchParams.set('cityName', params.cityName);
  }
  if (params?.checkedInWithinDays) {
    searchParams.set('checkedInWithinDays', String(params.checkedInWithinDays));
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  const queryString = searchParams.toString();
  return request<CheckinFootprintDto>(`/api/checkin-spots/footprint${queryString ? `?${queryString}` : ''}`);
}

// 获取个人主页概览统计，避免前端依赖当前页列表自行计数。
export function fetchUserProfileOverview() {
  return request<UserProfileOverviewDto>('/api/profile/overview');
}

// 用百度地点检索把用户输入的起点名称解析成候选坐标。
export function fetchPoiCalibrationCandidates(cityName: string, keyword: string, addressKeyword?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('cityName', cityName);
  searchParams.set('keyword', keyword);
  if (addressKeyword) {
    searchParams.set('addressKeyword', addressKeyword);
  }

  return request<PoiCalibrationCandidateDto[]>(`/api/poi-calibration/candidates?${searchParams.toString()}`);
}

// 提交行程规划参数，返回统一的行程结果结构。
export function fetchRoutePlan(payload: RoutePlanRequestDto) {
  return request<RoutePlanResponseDto>('/api/routes/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 保存当前规划结果到“我的行程”。
export function saveUserTrip(payload: SaveTripRequestDto) {
  return request<number>('/api/user-trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 获取当前登录用户的行程列表，筛选、排序和分页统一交给后端处理。
export function fetchUserTrips(params?: {
  cityName?: string;
  pageNum?: number;
  pageSize?: number;
  planMode?: string;
  sortBy?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.cityName) {
    searchParams.set('cityName', params.cityName);
  }
  if (params?.pageNum) {
    searchParams.set('pageNum', String(params.pageNum));
  }
  if (params?.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }
  if (params?.planMode) {
    searchParams.set('planMode', params.planMode);
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  const queryString = searchParams.toString();
  return request<PageResponse<UserTripSummaryDto>>(`/api/user-trips${queryString ? `?${queryString}` : ''}`);
}

// 获取指定已保存行程的详情。
export function fetchUserTripDetail(tripId: number) {
  return request<UserTripDetailDto>(`/api/user-trips/${tripId}`);
}

// 获取公开分享的行程详情，未登录用户也可以访问。
export function fetchPublicTripDetail(shareToken: string) {
  return request<UserTripDetailDto>(`/api/public-trips/${shareToken}`);
}

// 开启或关闭当前用户行程的公开分享状态。
export function updateUserTripShare(tripId: number, enabled: boolean) {
  return request<TripShareDto>(`/api/user-trips/${tripId}/share?enabled=${String(enabled)}`, {
    method: 'PUT',
  });
}

// 更新当前用户已保存行程的名称。
export function updateUserTripName(tripId: number, payload: UpdateTripNameRequestDto) {
  return request<null>(`/api/user-trips/${tripId}/name`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// 删除指定已保存行程。
export function deleteUserTrip(tripId: number) {
  return request<null>(`/api/user-trips/${tripId}`, {
    method: 'DELETE',
  });
}
