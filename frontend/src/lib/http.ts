import type { ApiResponse } from '../types/mapWorkbench';
import { clearAuthToken, getAuthToken } from './authToken';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// 通用请求封装，统一处理后端 ApiResponse 结构和错误信息。
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authToken = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });

  const payload = await parseApiPayload<T>(response);
  if (response.status === 401) {
    // 任一受保护接口确认登录失效后统一退出；公开地图请求随后不再携带过期 Token。
    clearAuthToken();
  }
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || buildHttpErrorMessage(response.status));
  }

  return payload.data;
}

/**
 * 优先按后端统一响应结构解析；如果 dev 代理或网关返回了非 JSON 错误页，这里兜底成 null。
 */
async function parseApiPayload<T>(response: Response): Promise<ApiResponse<T> | null> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    await response.text();
    return null;
  }

  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function buildHttpErrorMessage(status: number) {
  if (status >= 500) {
    return '服务暂时不可用，请联系网站管理员~';
  }
  if (status === 404) {
    return '请求的接口不存在';
  }
  return '请求失败';
}
