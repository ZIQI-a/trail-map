import { useSyncExternalStore } from "react";
import { getAuthToken, subscribeAuthToken } from "../lib/authToken";

/**
 * 响应式读取登录令牌，确保自动过期、主动退出和跨标签页退出都能立即更新页面。
 */
export function useAuthToken() {
  return useSyncExternalStore(subscribeAuthToken, getAuthToken, () => null);
}
