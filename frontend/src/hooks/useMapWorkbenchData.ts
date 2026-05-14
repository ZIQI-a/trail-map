import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchCities, fetchCity, fetchCitySpots, fetchCityTags, fetchPoiCalibrationCandidates, fetchRoutePlan, fetchSpotDetail } from '../api/mapWorkbench';
import type { ActiveSpotFilter } from '../components/map-workbench/WorkbenchHeader';
import type { RoutePlanRequestDto } from '../types/mapWorkbench';

// 地图工作台查询集合，集中管理城市、标签、列表和详情请求。
export function useCitiesQuery() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });
}

// 下面的查询都依赖 cityId 或 spotId，调用时需要保证参数有效性以避免不必要的请求。
export function useCityDetailQuery(cityId?: number) {
  return useQuery({
    queryKey: ['city-detail', cityId],
    queryFn: () => fetchCity(cityId!),
    enabled: cityId != null,
  });
}

// 城市标签查询
export function useCityTagsQuery(cityId?: number) {
  return useQuery({
    queryKey: ['city-tags', cityId],
    queryFn: () => fetchCityTags(cityId!),
    enabled: cityId != null,
  });
}
// 城市景点列表查询，支持基于标签和关键词的筛选
export function useCitySpotsQuery(cityId?: number, activeFilter?: ActiveSpotFilter, keyword?: string) {
  return useQuery({
    queryKey: ['city-spots', cityId, activeFilter, keyword],
    queryFn: () =>
      fetchCitySpots(cityId!, {
        keyword: keyword?.trim() || undefined,
        tagCode: activeFilter && activeFilter !== 'all' ? activeFilter : undefined,
      }),
    // 筛选和搜索切换时保留上一份列表数据，避免地图工作台整块回到首次加载态。
    placeholderData: (previousData) => previousData,
    enabled: cityId != null,
  });
}

// 景点详情查询
export function useSpotDetailQuery(spotId?: number) {
  return useQuery({
    queryKey: ['spot-detail', spotId],
    queryFn: () => fetchSpotDetail(spotId!),
    enabled: spotId != null,
  });
}

// 起点联想查询：由页面层控制输入防抖和触发时机，这里只负责候选请求。
export function usePoiCandidatesQuery(
  cityName?: string,
  keyword?: string,
  enabled = true,
  addressKeyword?: string,
) {
  return useQuery({
    queryKey: ['poi-candidates', cityName, keyword, addressKeyword],
    queryFn: () =>
      fetchPoiCalibrationCandidates(
        cityName!,
        keyword!.trim(),
        addressKeyword?.trim() || undefined,
      ),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(cityName && keyword?.trim() && keyword.trim().length >= 2),
  });
}

// 行程规划使用 mutation，避免筛选类 query 行为和“主动提交规划”混在一起。
export function useRoutePlanMutation() {
  return useMutation({
    mutationFn: (payload: RoutePlanRequestDto) => fetchRoutePlan(payload),
  });
}
