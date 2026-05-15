// 前端用户信息响应，不包含 passwordHash 等敏感字段。
export interface AppUserDto {
  id: number;
  username: string;
  nickname: string;
  userType: "normal" | "member" | "admin";
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  status: number;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthLoginResponseDto {
  token: string;
  tokenType: "Bearer";
  user: AppUserDto;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RegisterRequestDto extends LoginRequestDto {
  nickname: string;
}
