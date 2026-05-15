const AUTH_TOKEN_KEY = "trailmap_auth_token";

// authToken 统一管理本地登录令牌，避免业务组件直接操作 localStorage key。
export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}
