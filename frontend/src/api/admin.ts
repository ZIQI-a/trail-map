import { request } from "../lib/http";
import type { AppUserDto, UserUpdateRequestDto } from "../types/auth";
import type { PageResponse } from "../types/mapWorkbench";

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
