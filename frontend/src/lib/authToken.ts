const AUTH_TOKEN_KEY = "trailmap_auth_token";
const AUTH_TOKEN_CHANGE_EVENT = "trailmap-auth-token-change";

// authToken 统一管理本地登录令牌，避免业务组件直接操作 localStorage key。
export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifyAuthTokenChange();
}

export function clearAuthToken() {
  if (window.localStorage.getItem(AUTH_TOKEN_KEY) === null) {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyAuthTokenChange();
}

/**
 * 订阅登录令牌变化，同时支持当前页面主动退出和其他浏览器标签页同步退出。
 */
export function subscribeAuthToken(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_TOKEN_KEY) {
      listener();
    }
  };
  window.addEventListener(AUTH_TOKEN_CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(AUTH_TOKEN_CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * 通知当前页面中的认证状态订阅者刷新，避免 localStorage 已清理但界面仍显示已登录。
 */
function notifyAuthTokenChange() {
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGE_EVENT));
}
