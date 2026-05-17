import { request } from "../lib/http";
import type { AppUserDto, UserUpdateRequestDto } from "../types/auth";
import type { PageResponse } from "../types/mapWorkbench";
import type { AdminCityDto, AdminCityFormDto, AdminOverviewDto, AdminSpotDto, AdminSpotFormDto } from "../types/admin";

// 管理端数据概览：由后端聚合用户、城市和景点统计，避免首页拉全量数据自行计算。
export function fetchAdminOverview() {
  return request<AdminOverviewDto>("/api/admin/overview");
}

// 管理员用户列表查询：后台页当前优先一次拉全量，再由前端分页和筛选。
export function fetchAdminUsers(pageNum?: number, pageSize?: number) {
  const searchParams = new URLSearchParams();
  if (pageNum) {
    searchParams.set("pageNum", String(pageNum));
  }
  if (pageSize) {
    searchParams.set("pageSize", String(pageSize));
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

// 管理员城市列表查询：后台页当前优先一次拉全量，再由前端分页和筛选。
export function fetchAdminCities(pageNum?: number, pageSize?: number) {
  const searchParams = new URLSearchParams();
  if (pageNum) {
    searchParams.set("pageNum", String(pageNum));
  }
  if (pageSize) {
    searchParams.set("pageSize", String(pageSize));
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
