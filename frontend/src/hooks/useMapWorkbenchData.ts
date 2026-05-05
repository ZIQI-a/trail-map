import { useQuery } from '@tanstack/react-query';
import { fetchCities, fetchCity, fetchCitySpots, fetchCityTags, fetchSpotDetail } from '../api/mapWorkbench';
import type { ActiveSpotFilter } from '../components/map-workbench/WorkbenchHeader';

// 地图工作台查询集合，集中管理城市、标签、列表和详情请求。
export function useCitiesQuery() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });
}

export function useCityDetailQuery(cityId?: number) {
  return useQuery({
    queryKey: ['city-detail', cityId],
    queryFn: () => fetchCity(cityId!),
    enabled: cityId != null,
  });
}

export function useCityTagsQuery(cityId?: number) {
  return useQuery({
    queryKey: ['city-tags', cityId],
    queryFn: () => fetchCityTags(cityId!),
    enabled: cityId != null,
  });
}

export function useCitySpotsQuery(cityId?: number, activeFilter?: ActiveSpotFilter, keyword?: string) {
  return useQuery({
    queryKey: ['city-spots', cityId, activeFilter, keyword],
    queryFn: () =>
      fetchCitySpots(cityId!, {
        keyword: keyword?.trim() || undefined,
        tagCode: activeFilter && activeFilter !== 'all' ? activeFilter : undefined,
      }),
    enabled: cityId != null,
  });
}

export function useSpotDetailQuery(spotId?: number) {
  return useQuery({
    queryKey: ['spot-detail', spotId],
    queryFn: () => fetchSpotDetail(spotId!),
    enabled: spotId != null,
  });
}
