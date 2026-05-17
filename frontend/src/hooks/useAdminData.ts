import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createAdminCity,
  createAdminSpot,
  deleteAdminCity,
  deleteAdminSpot,
  fetchAdminCities,
  fetchAdminSpots,
  fetchAdminUsers,
  updateAdminCity,
  updateAdminSpot,
  updateAdminUser,
} from "../api/admin";
import type { AdminCityFormDto, AdminSpotFormDto } from "../types/admin";
import type { UserUpdateRequestDto } from "../types/auth";

// 管理后台查询：当前主数据源是用户列表，后续可继续扩展景点、路线和反馈管理。
export function useAdminUsersQuery(pageNum = 1, pageSize = 20, enabled = true) {
  return useQuery({
    queryKey: ["admin", "users", pageNum, pageSize],
    queryFn: () => fetchAdminUsers(pageNum, pageSize),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminUserUpdateMutation() {
  return useMutation({
    mutationFn: (payload: { userId: number; data: UserUpdateRequestDto }) =>
      updateAdminUser(payload.userId, payload.data),
  });
}

export function useAdminCitiesQuery(pageNum = 1, pageSize = 50, enabled = true) {
  return useQuery({
    queryKey: ["admin", "cities", pageNum, pageSize],
    queryFn: () => fetchAdminCities(pageNum, pageSize),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminCityCreateMutation() {
  return useMutation({
    mutationFn: (payload: AdminCityFormDto) => createAdminCity(payload),
  });
}

export function useAdminCityUpdateMutation() {
  return useMutation({
    mutationFn: (payload: { cityId: number; data: Partial<AdminCityFormDto> }) =>
      updateAdminCity(payload.cityId, payload.data),
  });
}

export function useAdminCityDeleteMutation() {
  return useMutation({
    mutationFn: (cityId: number) => deleteAdminCity(cityId),
  });
}

export function useAdminSpotsQuery(
  pageNum = 1,
  pageSize = 50,
  params?: { cityId?: number; keyword?: string; type?: string; status?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin", "spots", pageNum, pageSize, params],
    queryFn: () => fetchAdminSpots(pageNum, pageSize, params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminSpotCreateMutation() {
  return useMutation({
    mutationFn: (payload: AdminSpotFormDto) => createAdminSpot(payload),
  });
}

export function useAdminSpotUpdateMutation() {
  return useMutation({
    mutationFn: (payload: { spotId: number; data: Partial<AdminSpotFormDto> }) =>
      updateAdminSpot(payload.spotId, payload.data),
  });
}

export function useAdminSpotDeleteMutation() {
  return useMutation({
    mutationFn: (spotId: number) => deleteAdminSpot(spotId),
  });
}
