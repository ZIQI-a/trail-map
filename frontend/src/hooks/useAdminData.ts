import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAdminUsers, updateAdminUser } from "../api/admin";
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
