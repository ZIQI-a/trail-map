// 前端用户信息响应，不包含 passwordHash 等敏感字段。
export interface AppUserDto {
  id: number;
  username: string;
  nickname: string;
  userType: "normal" | "member" | "admin";
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
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

// 管理员修改用户时复用后端更新接口字段，密码重置后续再单独扩展。
export interface UserUpdateRequestDto {
  nickname?: string;
  userType?: AppUserDto["userType"];
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
  status?: number;
}

export interface UserProfileUpdateRequestDto {
  nickname?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
}
