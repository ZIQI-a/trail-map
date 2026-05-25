import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth';
import { checkinSpot, deleteUserTrip, favoriteSpot, fetchAllTags, fetchCheckinSpotStatus, fetchCheckinSpots, fetchCities, fetchCity, fetchCitySpots, fetchCityTags, fetchFavoriteSpotStatus, fetchFavoriteSpots, fetchPoiCalibrationCandidates, fetchPublicTripDetail, fetchRoutePlan, fetchSpotDetail, fetchUserTripDetail, fetchUserTrips, saveUserTrip, uncheckinSpot, unfavoriteSpot, updateUserTripShare } from '../api/mapWorkbench';
import type { ActiveSpotFilter } from '../components/map-workbench/WorkbenchHeader';
import type { LoginRequestDto, RegisterRequestDto } from '../types/auth';
import type { RoutePlanRequestDto, SaveTripRequestDto } from '../types/mapWorkbench';

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

// 全量标签查询
export function useAllTagsQuery() {
  return useQuery({
    queryKey: ['all-tags'],
    queryFn: fetchAllTags,
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

// 收藏状态只在已登录且已选中景点时查询，避免未登录时产生 401 请求。
export function useFavoriteSpotStatusQuery(spotId?: number, enabled = false) {
  return useQuery({
    queryKey: ['favorite-spot-status', spotId],
    queryFn: () => fetchFavoriteSpotStatus(spotId!),
    enabled: enabled && spotId != null,
  });
}

export function useFavoriteSpotMutation() {
  return useMutation({
    mutationFn: (spotId: number) => favoriteSpot(spotId),
  });
}

export function useUnfavoriteSpotMutation() {
  return useMutation({
    mutationFn: (spotId: number) => unfavoriteSpot(spotId),
  });
}

// 收藏页当前先拉完整景点收藏，再由前端做筛选和分页，避免筛选后页码与总数错乱。
export function useFavoriteSpotsQuery(
  params: {
    tagCode?: string;
    cityName?: string;
    favoritedWithinDays?: number;
    sortBy?: string;
    pageNum: number;
    pageSize: number;
  },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['favorite-spots', params],
    queryFn: () => fetchFavoriteSpots(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

// 打卡状态只在已登录且已选中景点时查询，和收藏状态保持同一套触发策略。
export function useCheckinSpotStatusQuery(spotId?: number, enabled = false) {
  return useQuery({
    queryKey: ['checkin-spot-status', spotId],
    queryFn: () => fetchCheckinSpotStatus(spotId!),
    enabled: enabled && spotId != null,
  });
}

export function useCheckinSpotMutation() {
  return useMutation({
    mutationFn: (payload: { spotId: number; remark?: string }) =>
      checkinSpot(payload.spotId, { remark: payload.remark }),
  });
}

export function useUncheckinSpotMutation() {
  return useMutation({
    mutationFn: (spotId: number) => uncheckinSpot(spotId),
  });
}

// 我的足迹列表查询，分页和筛选参数交给后端，前端只负责视图切换。
export function useCheckinSpotsQuery(
  params: {
    tagCode?: string;
    cityName?: string;
    checkedInWithinDays?: number;
    sortBy?: string;
    pageNum: number;
    pageSize: number;
  },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['checkin-spots', params],
    queryFn: () => fetchCheckinSpots(params),
    enabled,
    placeholderData: (previousData) => previousData,
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

// 保存规划结果到用户账号。
export function useSaveUserTripMutation() {
  return useMutation({
    mutationFn: (payload: SaveTripRequestDto) => saveUserTrip(payload),
  });
}

// 我的行程列表查询。
export function useUserTripsQuery(
  params: {
    pageNum: number;
    pageSize: number;
  },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['user-trips', params],
    queryFn: () => fetchUserTrips(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

// 单个行程详情查询，点击卡片后按需加载。
export function useUserTripDetailQuery(tripId?: number, enabled = false) {
  return useQuery({
    queryKey: ['user-trip-detail', tripId],
    queryFn: () => fetchUserTripDetail(tripId!),
    enabled: enabled && tripId != null,
  });
}

// 公开分享行程详情查询，不依赖登录态。
export function usePublicTripDetailQuery(shareToken?: string, enabled = false) {
  return useQuery({
    queryKey: ['public-trip-detail', shareToken],
    queryFn: () => fetchPublicTripDetail(shareToken!),
    enabled: enabled && Boolean(shareToken),
  });
}

// 更新行程公开分享状态。
export function useUpdateUserTripShareMutation() {
  return useMutation({
    mutationFn: (payload: { enabled: boolean; tripId: number }) =>
      updateUserTripShare(payload.tripId, payload.enabled),
  });
}

// 删除已保存行程。
export function useDeleteUserTripMutation() {
  return useMutation({
    mutationFn: (tripId: number) => deleteUserTrip(tripId),
  });
}

// 当前用户查询：只有本地存在 token 时才触发。
export function useCurrentUserQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    enabled,
    retry: false,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequestDto) => loginUser(payload),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterRequestDto) => registerUser(payload),
  });
}
