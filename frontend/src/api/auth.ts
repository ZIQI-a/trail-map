import { request } from "../lib/http";
import type {
  AppUserDto,
  AuthLoginResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserProfileUpdateRequestDto,
} from "../types/auth";

// 用户注册：后端注册成功后直接返回 token 和当前用户。
export function registerUser(payload: RegisterRequestDto) {
  return request<AuthLoginResponseDto>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 用户登录：使用用户名和密码换取 Bearer Token。
export function loginUser(payload: LoginRequestDto) {
  return request<AuthLoginResponseDto>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 当前用户：依赖请求层自动携带 Authorization。
export function fetchCurrentUser() {
  return request<AppUserDto>("/api/auth/me");
}

// 当前用户编辑个人资料。
export function updateCurrentUserProfile(payload: UserProfileUpdateRequestDto) {
  return request<AppUserDto>("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
