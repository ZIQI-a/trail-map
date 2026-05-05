import type { ApiResponse } from '../types/mapWorkbench';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// 通用请求封装，统一处理后端 ApiResponse 结构和错误信息。
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || '请求失败');
  }

  return payload.data;
}
