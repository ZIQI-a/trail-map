import { request } from "../lib/http";
import type { AppUserDto, UserUpdateRequestDto } from "../types/auth";
import type { PageResponse } from "../types/mapWorkbench";
import type { AdminCityDto, AdminCityFormDto, AdminSpotDto, AdminSpotFormDto } from "../types/admin";

// 管理员用户列表查询：当前默认按后端分页接口拉取，避免一次加载全部用户。
export function fetchAdminUsers(pageNum = 1, pageSize = 20) {
  return request<PageResponse<AppUserDto>>(
    `/api/users?pageNum=${pageNum}&pageSize=${pageSize}`,
  );
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

// 管理员城市列表查询：用于后台城市管理表格。
export function fetchAdminCities(pageNum = 1, pageSize = 50) {
  return request<PageResponse<AdminCityDto>>(
    `/api/admin/cities?pageNum=${pageNum}&pageSize=${pageSize}`,
  );
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
  pageNum = 1,
  pageSize = 50,
  params?: { cityId?: number; keyword?: string; type?: string; status?: number },
) {
  const searchParams = new URLSearchParams();
  searchParams.set("pageNum", String(pageNum));
  searchParams.set("pageSize", String(pageSize));
  if (params?.cityId) {
    searchParams.set("cityId", String(params.cityId));
  }
  if (params?.keyword) {
    searchParams.set("keyword", params.keyword);
  }
  if (params?.type) {
    searchParams.set("type", params.type);
  }
  if (params?.status) {
    searchParams.set("status", String(params.status));
  }

  return request<PageResponse<AdminSpotDto>>(`/api/admin/spots?${searchParams.toString()}`);
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
