import { request } from "../lib/http";
import type { AppUserDto, UserUpdateRequestDto } from "../types/auth";
import type { PageResponse } from "../types/mapWorkbench";
import type {
  AdminCityDto,
  AdminCityFormDto,
  AdminCityLocationDto,
  AdminCityOptionDto,
  AdminOverviewDto,
  AdminSpotDto,
  AdminSpotFormDto,
} from "../types/admin";
import type { PoiCalibrationCandidateDto } from "../types/mapWorkbench";

// 管理端数据概览：由后端聚合用户、城市和景点统计，避免首页拉全量数据自行计算。
export function fetchAdminOverview() {
  return request<AdminOverviewDto>("/api/admin/overview");
}

// 管理员用户列表查询：分页、搜索和筛选均交给后端处理。
export function fetchAdminUsers(
  pageNum?: number,
  pageSize?: number,
  params?: { keyword?: string; userType?: string; status?: number },
) {
  const searchParams = new URLSearchParams();
  if (pageNum) {
    searchParams.set("pageNum", String(pageNum));
  }
  if (pageSize) {
    searchParams.set("pageSize", String(pageSize));
  }
  if (params?.keyword) {
    searchParams.set("keyword", params.keyword);
  }
  if (params?.userType) {
    searchParams.set("userType", params.userType);
  }
  if (params?.status !== undefined) {
    searchParams.set("status", String(params.status));
  }
  const queryString = searchParams.toString();
  return request<PageResponse<AppUserDto>>(`/api/users${queryString ? `?${queryString}` : ""}`);
}

// 管理员更新用户：当前先支持角色、状态和基础资料调整。
export function updateAdminUser(
  userId: number,
  payload: UserUpdateRequestDto,
) {
  return request<AppUserDto>(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// 管理员城市列表查询：分页和关键词筛选均交给后端处理。
export function fetchAdminCities(
  pageNum?: number,
  pageSize?: number,
  params?: { keyword?: string },
) {
  const searchParams = new URLSearchParams();
  if (pageNum) {
    searchParams.set("pageNum", String(pageNum));
  }
  if (pageSize) {
    searchParams.set("pageSize", String(pageSize));
  }
  if (params?.keyword) {
    searchParams.set("keyword", params.keyword);
  }
  const queryString = searchParams.toString();
  return request<PageResponse<AdminCityDto>>(`/api/admin/cities${queryString ? `?${queryString}` : ""}`);
}

export function createAdminCity(payload: AdminCityFormDto) {
  return request<AdminCityDto>("/api/admin/cities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminCity(cityId: number, payload: Partial<AdminCityFormDto>) {
  return request<AdminCityDto>(`/api/admin/cities/${cityId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCity(cityId: number) {
  return request<void>(`/api/admin/cities/${cityId}`, {
    method: "DELETE",
  });
}

// 按城市或省份名称远程搜索城市候选，候选同时携带可信的省市归属。
export function searchAdminCityOptions(keyword: string) {
  const searchParams = new URLSearchParams({ keyword });
  return request<AdminCityOptionDto[]>(
    `/api/admin/map-data/city-suggestions?${searchParams.toString()}`,
  );
}

// 确认城市候选后获取标准名称、adcode 和 GCJ-02 中心点。
export function resolveAdminCityLocation(
  provinceCode: string,
  cityCode: string,
) {
  const searchParams = new URLSearchParams({ provinceCode, cityCode });
  return request<AdminCityLocationDto>(
    `/api/admin/map-data/city-location?${searchParams.toString()}`,
  );
}

// 管理端景点联想通过后端调用百度服务端接口，避免浏览器暴露服务端 AK。
export function fetchAdminSpotCandidates(cityName: string, keyword: string) {
  const searchParams = new URLSearchParams({ cityName, keyword });
  return request<PoiCalibrationCandidateDto[]>(
    `/api/admin/map-data/spot-candidates?${searchParams.toString()}`,
  );
}

// 管理员景点列表查询：支持后台城市、关键词、类型和状态筛选。
export function fetchAdminSpots(
  pageNum?: number,
  pageSize?: number,
  params?: { cityId?: number; keyword?: string; type?: string; status?: number },
) {
  const searchParams = new URLSearchParams();
  if (pageNum) {
    searchParams.set("pageNum", String(pageNum));
  }
  if (pageSize) {
    searchParams.set("pageSize", String(pageSize));
  }
  if (params?.cityId) {
    searchParams.set("cityId", String(params.cityId));
  }
  if (params?.keyword) {
    searchParams.set("keyword", params.keyword);
  }
  if (params?.type) {
    searchParams.set("type", params.type);
  }
  if (params?.status !== undefined) {
    searchParams.set("status", String(params.status));
  }

  const queryString = searchParams.toString();
  return request<PageResponse<AdminSpotDto>>(`/api/admin/spots${queryString ? `?${queryString}` : ""}`);
}

export function createAdminSpot(payload: AdminSpotFormDto) {
  return request<AdminSpotDto>("/api/admin/spots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminSpot(spotId: number, payload: Partial<AdminSpotFormDto>) {
  return request<AdminSpotDto>(`/api/admin/spots/${spotId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminSpot(spotId: number) {
  return request<void>(`/api/admin/spots/${spotId}`, {
    method: "DELETE",
  });
}
