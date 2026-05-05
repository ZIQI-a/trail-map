import { QueryClient } from '@tanstack/react-query';

// QueryClient 统一管理前端数据请求缓存和重试策略。
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
