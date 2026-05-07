import { request } from '../lib/http';
import type {
  PageResponse,
  RoutePlanRequestDto,
  RoutePlanResponseDto,
  SpotTagDto,
  TravelCityDto,
  TravelSpotDetailDto,
  TravelSpotSummaryDto,
} from '../types/mapWorkbench';

// 获取城市列表，当前阶段默认不传分页参数，直接拿完整列表。
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

// 提交行程规划参数，返回统一的行程结果结构。
export function fetchRoutePlan(payload: RoutePlanRequestDto) {
  return request<RoutePlanResponseDto>('/api/routes/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
