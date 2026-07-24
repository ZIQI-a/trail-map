import { SettingOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  message,
  Modal,
  notification,
  Segmented,
  Tooltip,
} from "antd";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchPoiCalibrationCandidates } from "../../api/mapWorkbench";
import { BaiduMapStage } from "../../components/map-workbench/BaiduMapStage";
import type { RouteTimelineFocusTarget } from "../../components/map-workbench/RoutePlanDrawer";
import {
  SpotRecommendList,
  type RecommendTab,
} from "../../components/map-workbench/SpotRecommendList";
import { TripPlannerDock } from "../../components/map-workbench/TripPlannerDock";
import {
  WorkbenchHeader,
  type ActiveSpotFilter,
} from "../../components/map-workbench/WorkbenchHeader";
import {
  useCheckinSpotMutation,
  useCheckinSpotStatusQuery,
  useFavoriteSpotMutation,
  useFavoriteSpotStatusQuery,
  useCitiesQuery,
  useCityDetailQuery,
  useCitySpotsQuery,
  useCityTagsQuery,
  useCurrentUserQuery,
  useLoginMutation,
  usePoiCandidatesQuery,
  usePublicTripDetailQuery,
  useRegisterMutation,
  useRoutePlanMutation,
  useSaveUserTripMutation,
  useSpotDetailQuery,
  useUncheckinSpotMutation,
  useUnfavoriteSpotMutation,
  useUpdateUserTripNameMutation,
  useUpdateUserTripShareMutation,
  useUserTripDetailQuery,
} from "../../hooks/useMapWorkbenchData";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useAuthToken } from "../../hooks/useAuthToken";
import {
  clearAuthToken,
  setAuthToken,
} from "../../lib/authToken";
import { createBaiduPoint, loadBaiduMapGL } from "../../lib/baiduMap";
import type { LoginRequestDto, RegisterRequestDto } from "../../types/auth";
import type {
  GeoPoint,
  ItineraryItemDto,
  LocationArrangeMode,
  PlanMode,
  PoiCalibrationCandidateDto,
  RouteLocation,
  RouteSegmentDto,
  RoutePlanResponseDto,
  SchedulePlanConfig,
  SpotTag,
  SpotTagDto,
  SpotTagCode,
  TransportType,
  TravelCity,
  TravelCityDto,
  TravelSpot,
  TravelSpotDetailDto,
  TravelSpotSummaryDto,
  UserTripDetailDto,
  UserTripItemDetailDto,
  UserTripRouteSegmentDetailDto,
} from "../../types/mapWorkbench";
import { wgs84ToGcj02 } from "../../utils/map-workbench/coordinate";
import { getItineraryActivityColor } from "../../utils/map-workbench/routePalette";
import { getVisibleSpots } from "../../utils/map-workbench/spotFilters";
import { buildSaveTripPayload } from "../../utils/map-workbench/tripPayload";
import styles from "./MapWorkbenchPage.module.css";

const AuthDialog = lazy(() =>
  import("../../components/map-workbench/AuthDialog").then((module) => ({
    default: module.AuthDialog,
  })),
);
const RoutePlanDrawer = lazy(() =>
  import("../../components/map-workbench/RoutePlanDrawer").then((module) => ({
    default: module.RoutePlanDrawer,
  })),
);
const SchedulePlanFormFields = lazy(() =>
  import("../../components/map-workbench/SchedulePlanFormFields").then(
    (module) => ({
      default: module.SchedulePlanFormFields,
    }),
  ),
);
const ScheduleResultSettingsDrawer = lazy(() =>
  import("../../components/map-workbench/ScheduleResultSettingsDrawer").then(
    (module) => ({
      default: module.ScheduleResultSettingsDrawer,
    }),
  ),
);
const SpotDetailPanel = lazy(() =>
  import("../../components/map-workbench/SpotDetailPanel").then((module) => ({
    default: module.SpotDetailPanel,
  })),
);

const transportTypes = [
  { label: "公共交通", value: "transit" as const },
  { label: "驾车", value: "driving" as const },
  { label: "步行", value: "walking" as const },
  { label: "骑行", value: "bicycling" as const },
];

const planModes = [
  { label: "自由路线", value: "free" as const },
  { label: "完整行程", value: "schedule" as const },
];

const defaultTripStartDate = formatDateOffset(1);
const defaultTripEndDate = formatDateOffset(2);

const defaultScheduleConfig: SchedulePlanConfig = {
  tripName: "",
  tripStartDate: defaultTripStartDate,
  tripEndDate: defaultTripEndDate,
  tripDays: 2,
  travelerCount: 2,
  dailyStartTime: "09:00",
  dailyEndTime: "18:00",
  includeLunchBreak: true,
  includeNightTour: false,
  intensity: "standard",
  lunchMode: "recommended",
  lunchPlaceName: "",
  lunchLocation: undefined,
  restMode: "none",
  restPlaceName: "",
  restLocation: undefined,
  hotelMode: "none",
  hotelName: "",
  hotelLocation: undefined,
  returnToHotel: false,
  preferenceTags: [],
};

// MapWorkbenchPage 是地图工作台页面入口，只组织页面布局和跨组件共享状态。
export function MapWorkbenchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const authToken = useAuthToken();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authError, setAuthError] = useState<string>();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveSpotFilter>("all");
  const [activeRecommendTab, setActiveRecommendTab] =
    useState<RecommendTab>("recommend");
  //
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(() =>
    parsePositiveNumber(searchParams.get("cityId")),
  );
  const [selectedSpotId, setSelectedSpotId] = useState<number | undefined>(
    () => {
      const spotIdText = searchParams.get("spotId");
      const spotId = spotIdText ? Number(spotIdText) : undefined;
      return spotId && Number.isFinite(spotId) ? spotId : undefined;
    },
  );
  const [tripSpotIds, setTripSpotIds] = useState<number[]>([]);
  const [startPoint, setStartPoint] = useState("");
  const [startPointPosition, setStartPointPosition] = useState<GeoPoint>();
  const [startPointPicking, setStartPointPicking] = useState(false);
  const [locatingCurrentPosition, setLocatingCurrentPosition] = useState(false);
  const [plannerAssistError, setPlannerAssistError] = useState<string>();
  const [selectedTransport, setSelectedTransport] =
    useState<TransportType>("transit");
  const [selectedPlanMode, setSelectedPlanMode] = useState<PlanMode>("free");
  const [scheduleConfig, setScheduleConfig] = useState<SchedulePlanConfig>(
    defaultScheduleConfig,
  );
  const [scheduleConfigModalOpen, setScheduleConfigModalOpen] = useState(false);
  const [scheduleSettingsOpen, setScheduleSettingsOpen] = useState(false);
  const [scheduleConfigStep, setScheduleConfigStep] = useState(0);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(1);
  const [mapFocusTarget, setMapFocusTarget] = useState<MapFocusTarget>();
  const [currentLocationPosition, setCurrentLocationPosition] =
    useState<GeoPoint>();
  const [dragOverTripDock, setDragOverTripDock] = useState(false);
  const [routePlanResult, setRoutePlanResult] =
    useState<RoutePlanResponseDto>();
  const [activeTripId, setActiveTripId] = useState<number>();
  const [activeShareToken, setActiveShareToken] = useState<string | null>();

  const citiesQuery = useCitiesQuery();
  const routePlanMutation = useRoutePlanMutation();
  const saveUserTripMutation = useSaveUserTripMutation();
  const updateUserTripNameMutation = useUpdateUserTripNameMutation();
  const updateUserTripShareMutation = useUpdateUserTripShareMutation();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const favoriteSpotMutation = useFavoriteSpotMutation();
  const unfavoriteSpotMutation = useUnfavoriteSpotMutation();
  const checkinSpotMutation = useCheckinSpotMutation();
  const uncheckinSpotMutation = useUncheckinSpotMutation();
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const savedTripId = parsePositiveNumber(searchParams.get("tripId"));
  const publicShareToken = searchParams.get("shareToken")?.trim() || undefined;
  const savedTripDetailQuery = useUserTripDetailQuery(
    savedTripId,
    Boolean(authToken && savedTripId),
  );
  const publicTripDetailQuery = usePublicTripDetailQuery(
    publicShareToken,
    Boolean(publicShareToken),
  );

  const cities = useMemo(
    () =>
      (citiesQuery.data?.list ?? [])
        .map(mapCity)
        .filter((city): city is TravelCity => Boolean(city)),
    [citiesQuery.data?.list],
  );

  // 用户未主动切换时默认使用第一个城市；如果当前选择不在列表中，也回退到第一个城市。
  const activeCityId = cities.some((city) => city.id === selectedCityId)
    ? selectedCityId
    : cities[0]?.id;
  const cityDetailQuery = useCityDetailQuery(activeCityId);
  const tagsQuery = useCityTagsQuery(activeCityId);
  const debouncedStartPoint = useDebouncedValue(startPoint, 300);
  const debouncedHotelKeyword = useDebouncedValue(
    scheduleConfig.hotelName,
    300,
  );
  const debouncedLunchKeyword = useDebouncedValue(
    scheduleConfig.lunchPlaceName,
    300,
  );
  const debouncedRestKeyword = useDebouncedValue(
    scheduleConfig.restPlaceName,
    300,
  );
  const spotsQuery = useCitySpotsQuery(
    activeCityId,
    activeFilter,
    searchKeyword,
  );
  const city = useMemo(
    () =>
      mapCity(
        cityDetailQuery.data ?? cities.find((item) => item.id === activeCityId),
      ),
    [activeCityId, cities, cityDetailQuery.data],
  );
  const tags = useMemo(
    () => (tagsQuery.data ?? []).map(mapTag),
    [tagsQuery.data],
  );
  const poiCandidatesQuery = usePoiCandidatesQuery(
    city ? normalizeCityName(city.name) : undefined,
    debouncedStartPoint,
    !startPointPosition && !locatingCurrentPosition,
  );
  const spots = useMemo(
    () => (spotsQuery.data?.list ?? []).map((spot) => mapSpot(spot, city)),
    [city, spotsQuery.data?.list],
  );
  const visibleSpots = getVisibleSpots(
    spots,
    activeFilter,
    searchKeyword,
    activeRecommendTab,
  );
  // 工作台默认保持无选中态；只有用户主动选择且该景点仍在当前结果中时，才保留选中状态。
  const effectiveSelectedSpotId = visibleSpots.some(
    (spot) => spot.id === selectedSpotId,
  )
    ? selectedSpotId
    : undefined;
  const spotDetailQuery = useSpotDetailQuery(effectiveSelectedSpotId);
  const favoriteSpotStatusQuery = useFavoriteSpotStatusQuery(
    effectiveSelectedSpotId,
    Boolean(authToken),
  );
  const checkinSpotStatusQuery = useCheckinSpotStatusQuery(
    effectiveSelectedSpotId,
    Boolean(authToken),
  );
  const selectedSpot = useMemo(
    () =>
      mergeSpotDetail(
        visibleSpots.find((spot) => spot.id === effectiveSelectedSpotId),
        spotDetailQuery.data,
        city,
      ),
    [city, effectiveSelectedSpotId, spotDetailQuery.data, visibleSpots],
  );
  const nearbySpots = visibleSpots
    .filter((spot) => spot.id !== effectiveSelectedSpotId)
    .slice(0, 3);
  const tripSpots = tripSpotIds
    .map((spotId) => spots.find((spot) => spot.id === spotId))
    .filter((spot): spot is TravelSpot => Boolean(spot));
  const tripCenterPoint = useMemo(
    () => resolveTripCenterPoint(tripSpots, city?.center),
    [city?.center, tripSpots],
  );
  const pageError =
    citiesQuery.error ??
    cityDetailQuery.error ??
    tagsQuery.error ??
    spotsQuery.error;
  useEffect(() => {
    if (!pageError) {
      return;
    }
    messageApi.error({
      key: "map-workbench-data-error",
      content: "旅游数据服务暂时不可用，地图仍可继续浏览",
      duration: 5,
    });
  }, [messageApi, pageError]);
  const startPointOptions = useMemo(
    () =>
      (poiCandidatesQuery.data ?? []).map((candidate) => ({
        value: candidate.name,
        position: candidate.naviLocation ?? candidate.location ?? undefined,
        label: (
          <div className={styles.startPointOption}>
            <strong>{candidate.name}</strong>
            <span>
              {candidate.address || `${candidate.city}${candidate.area}`}
            </span>
          </div>
        ),
      })),
    [poiCandidatesQuery.data],
  );
  const hotelPoiCandidatesQuery = usePoiCandidatesQuery(
    city ? normalizeCityName(city.name) : undefined,
    debouncedHotelKeyword,
    scheduleConfig.hotelMode === "manual",
  );
  const lunchPoiCandidatesQuery = usePoiCandidatesQuery(
    city ? normalizeCityName(city.name) : undefined,
    debouncedLunchKeyword,
    scheduleConfig.lunchMode === "manual",
  );
  const restPoiCandidatesQuery = usePoiCandidatesQuery(
    city ? normalizeCityName(city.name) : undefined,
    debouncedRestKeyword,
    scheduleConfig.restMode === "manual",
  );
  const hotelOptions = useMemo(
    () =>
      buildManualLocationOptions(hotelPoiCandidatesQuery.data, tripCenterPoint),
    [hotelPoiCandidatesQuery.data, tripCenterPoint],
  );
  const lunchOptions = useMemo(
    () =>
      buildManualLocationOptions(lunchPoiCandidatesQuery.data, tripCenterPoint),
    [lunchPoiCandidatesQuery.data, tripCenterPoint],
  );
  const restOptions = useMemo(
    () =>
      buildManualLocationOptions(restPoiCandidatesQuery.data, tripCenterPoint),
    [restPoiCandidatesQuery.data, tripCenterPoint],
  );
  // 只有在完整行程模式下且有编排结果时才展示时间轴，其他情况都展示完整路线，避免用户混淆。
  const showingScheduleResult =
    routePlanResult?.planMode === "schedule" &&
    routePlanResult.itineraryDays.length > 0;
  const activeScheduleDay = showingScheduleResult
    ? (routePlanResult.itineraryDays.find(
        (day) => day.dayIndex === selectedScheduleDay,
      ) ?? routePlanResult.itineraryDays[0])
    : undefined;
  const visibleRouteSegments = useMemo(() => {
    if (!routePlanResult) {
      return undefined;
    }

    if (!showingScheduleResult || !activeScheduleDay) {
      return routePlanResult.segments;
    }
    return resolveScheduleMapSegments(routePlanResult, activeScheduleDay);
  }, [activeScheduleDay, routePlanResult, showingScheduleResult]);
  const mapRouteOverlays = useMemo(
    () =>
      buildMapRouteOverlays(
        routePlanResult,
        visibleRouteSegments,
        activeScheduleDay,
      ),
    [activeScheduleDay, routePlanResult, visibleRouteSegments],
  );
  const mapItineraryMarkers = useMemo(
    () => buildMapItineraryMarkers(activeScheduleDay?.items),
    [activeScheduleDay?.items],
  );

  // 从“我的规划”跳回工作台时，用 tripId 拉取已保存行程并回放到地图和右侧时间轴。
  useEffect(() => {
    if (!savedTripId) {
      return;
    }

    if (!authToken) {
      queueMicrotask(() => {
        setAuthError(undefined);
        setAuthDialogOpen(true);
      });
      return;
    }

    if (savedTripDetailQuery.error) {
      queueMicrotask(() => {
        setPlannerAssistError(
          savedTripDetailQuery.error instanceof Error
            ? savedTripDetailQuery.error.message
            : "已保存行程加载失败",
        );
      });
      return;
    }

    const savedTrip = savedTripDetailQuery.data;
    if (!savedTrip) {
      return;
    }

    queueMicrotask(() => {
      const nextRoutePlan = buildRoutePlanFromSavedTrip(savedTrip);
      setActiveTripId(savedTrip.id);
      setActiveShareToken(savedTrip.shareToken ?? null);
      setSelectedCityId(savedTrip.cityId);
      setSelectedTransport(savedTrip.transportType);
      setSelectedPlanMode(savedTrip.planMode);
      setTripSpotIds(resolveSavedTripSpotIds(savedTrip));
      setStartPoint(savedTrip.startName || `${savedTrip.cityName}市中心`);
      setStartPointPosition(
        nextRoutePlan.segments[0]?.fromPosition ?? undefined,
      );
      setScheduleConfig((currentConfig) => ({
        ...currentConfig,
        tripStartDate: savedTrip.startDate ?? currentConfig.tripStartDate,
        tripEndDate: savedTrip.endDate ?? currentConfig.tripEndDate,
        tripDays: savedTrip.days || currentConfig.tripDays,
        tripName: savedTrip.tripName || currentConfig.tripName,
        dailyStartTime:
          nextRoutePlan.itineraryDays[0]?.startTime ??
          currentConfig.dailyStartTime,
      }));
      setRoutePlanResult(nextRoutePlan);
      if (
        nextRoutePlan.planMode === "schedule" &&
        nextRoutePlan.itineraryDays[0]
      ) {
        setSelectedScheduleDay(nextRoutePlan.itineraryDays[0].dayIndex);
      }
    });
  }, [
    authToken,
    savedTripDetailQuery.data,
    savedTripDetailQuery.error,
    savedTripId,
  ]);

  // 公开分享链接不依赖登录态；通过 shareToken 加载别人公开的行程。
  useEffect(() => {
    if (!publicShareToken) {
      return;
    }

    if (publicTripDetailQuery.error) {
      queueMicrotask(() => {
        setPlannerAssistError(
          publicTripDetailQuery.error instanceof Error
            ? publicTripDetailQuery.error.message
            : "公开行程加载失败",
        );
      });
      return;
    }

    const publicTrip = publicTripDetailQuery.data;
    if (!publicTrip) {
      return;
    }

    queueMicrotask(() => {
      const nextRoutePlan = buildRoutePlanFromSavedTrip(publicTrip);
      setActiveTripId(publicTrip.id);
      setActiveShareToken(publicTrip.shareToken ?? publicShareToken);
      setSelectedCityId(publicTrip.cityId);
      setSelectedTransport(publicTrip.transportType);
      setSelectedPlanMode(publicTrip.planMode);
      setTripSpotIds(resolveSavedTripSpotIds(publicTrip));
      setStartPoint(publicTrip.startName || `${publicTrip.cityName}市中心`);
      setStartPointPosition(
        nextRoutePlan.segments[0]?.fromPosition ?? undefined,
      );
      setScheduleConfig((currentConfig) => ({
        ...currentConfig,
        tripStartDate: publicTrip.startDate ?? currentConfig.tripStartDate,
        tripEndDate: publicTrip.endDate ?? currentConfig.tripEndDate,
        tripDays: publicTrip.days || currentConfig.tripDays,
        tripName: publicTrip.tripName || currentConfig.tripName,
        dailyStartTime:
          nextRoutePlan.itineraryDays[0]?.startTime ??
          currentConfig.dailyStartTime,
      }));
      setRoutePlanResult(nextRoutePlan);
      if (
        nextRoutePlan.planMode === "schedule" &&
        nextRoutePlan.itineraryDays[0]
      ) {
        setSelectedScheduleDay(nextRoutePlan.itineraryDays[0].dayIndex);
      }
    });
  }, [
    publicShareToken,
    publicTripDetailQuery.data,
    publicTripDetailQuery.error,
  ]);

  async function handleLogin(payload: LoginRequestDto) {
    setAuthError(undefined);
    try {
      const result = await loginMutation.mutateAsync(payload);
      handleAuthSuccess(result.token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "登录失败");
    }
  }

  async function handleRegister(payload: RegisterRequestDto) {
    setAuthError(undefined);
    try {
      const result = await registerMutation.mutateAsync(payload);
      handleAuthSuccess(result.token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "注册失败");
    }
  }

  // 登录成功后先保存 token，再刷新当前用户查询，让 header 展示真实用户资料。
  function handleAuthSuccess(token: string) {
    setAuthToken(token);
    setAuthDialogOpen(false);
    setAuthError(undefined);
    void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }

  function handleLogout() {
    clearAuthToken();
    setAuthError(undefined);
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    queryClient.removeQueries({ queryKey: ["favorite-spot-status"] });
    queryClient.removeQueries({ queryKey: ["checkin-spot-status"] });
    queryClient.removeQueries({ queryKey: ["checkin-spots"] });
  }

  // 关闭已保存行程回放时同步移除 URL 参数，避免刷新页面后又自动打开同一条行程。
  function clearSavedTripReplayParam() {
    setActiveTripId(undefined);
    setActiveShareToken(undefined);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("tripId");
      nextParams.delete("shareToken");
      return nextParams;
    });
  }

  // 收藏按钮未登录时先拉起登录弹窗；已登录时按当前状态切换收藏关系。
  async function handleToggleFavorite(spotId: number) {
    if (!authToken) {
      setAuthError(undefined);
      setAuthDialogOpen(true);
      return;
    }

    try {
      if (favoriteSpotStatusQuery.data?.favorited) {
        await unfavoriteSpotMutation.mutateAsync(spotId);
      } else {
        await favoriteSpotMutation.mutateAsync(spotId);
      }
      await queryClient.invalidateQueries({
        queryKey: ["favorite-spot-status", spotId],
      });
    } catch (error) {
      setPlannerAssistError(
        error instanceof Error ? error.message : "收藏操作失败",
      );
    }
  }

  // 打卡按钮未登录时先拉起登录弹窗；已登录时按当前状态切换足迹关系。
  async function handleToggleCheckin(spotId: number) {
    if (!authToken) {
      setAuthError(undefined);
      setAuthDialogOpen(true);
      return;
    }

    try {
      if (checkinSpotStatusQuery.data?.checkedIn) {
        await uncheckinSpotMutation.mutateAsync(spotId);
      } else {
        await checkinSpotMutation.mutateAsync({ spotId });
      }
      await queryClient.invalidateQueries({
        queryKey: ["checkin-spot-status", spotId],
      });
      await queryClient.invalidateQueries({ queryKey: ["checkin-spots"] });
    } catch (error) {
      setPlannerAssistError(
        error instanceof Error ? error.message : "打卡操作失败",
      );
    }
  }

  // 加入行程时去重，避免同一个景点在路线规划池中重复出现。
  function handleAddToTrip(spotId: number) {
    setPlannerAssistError(undefined);
    setRoutePlanResult(undefined);
    setTripSpotIds((currentIds) =>
      currentIds.includes(spotId) ? currentIds : [...currentIds, spotId],
    );
  }

  // 删除行程池中的单个景点，其他景点顺序保持不变。
  function handleRemoveTripSpot(spotId: number) {
    setPlannerAssistError(undefined);
    setRoutePlanResult(undefined);
    setTripSpotIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== spotId),
    );
  }

  // 行程池排序会影响下一次路线规划的景点顺序，因此排序后清空旧规划结果。
  function handleReorderTripSpot(fromIndex: number, toIndex: number) {
    setPlannerAssistError(undefined);
    setRoutePlanResult(undefined);
    setTripSpotIds((currentIds) =>
      reorderByIndex(currentIds, fromIndex, toIndex),
    );
  }

  // 左侧推荐景点拖拽时只写入景点 id，底部行程栏负责接收并复用加入行程逻辑。
  function handleDragRecommendSpot(
    event: DragEvent<HTMLButtonElement>,
    spot: TravelSpot,
  ) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/trailmap-spot-id", String(spot.id));
    event.dataTransfer.setData("text/plain", String(spot.id));
  }

  function handleTripDockDragOver(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes("application/trailmap-spot-id")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOverTripDock(true);
  }

  function handleDropRecommendSpot(event: DragEvent<HTMLElement>) {
    const spotIdText = event.dataTransfer.getData(
      "application/trailmap-spot-id",
    );
    if (!spotIdText) {
      return;
    }

    event.preventDefault();
    setDragOverTripDock(false);
    const spotId = Number(spotIdText);
    if (Number.isFinite(spotId)) {
      handleAddToTrip(spotId);
    }
  }

  // 切换城市时同步清空景点选中和行程池，避免旧城市状态残留到新城市。
  function handleCityChange(cityId: number) {
    setSelectedCityId(cityId);
    setSelectedSpotId(undefined);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("cityId", String(cityId));
      nextParams.delete("spotId");
      return nextParams;
    });
    setTripSpotIds([]);
    setRoutePlanResult(undefined);
    setStartPoint("");
    setStartPointPosition(undefined);
    setStartPointPicking(false);
    setPlannerAssistError(undefined);
  }

  // 起点是路线规划的必填项；缺失时只展示轻量提示，不再静默回退到城市中心点。
  async function handlePlanRoute() {
    if (!city || tripSpots.length === 0) {
      return;
    }

    if (!validateStartPoint()) {
      return;
    }

    if (selectedPlanMode === "schedule") {
      setScheduleConfigModalOpen(true);
      return;
    }

    await submitRoutePlan();
  }

  // 完整行程模式先弹出详细配置，确认后再真正调用后端编排接口。
  async function handleSubmitSchedulePlan() {
    setScheduleConfigModalOpen(false);
    setScheduleConfigStep(0);
    await submitRoutePlan(scheduleConfig);
  }

  // 统一路线规划提交逻辑，自由路线和完整行程只在参数上有差异。
  async function submitRoutePlan(config?: SchedulePlanConfig) {
    if (!city || tripSpots.length === 0) {
      return;
    }

    if (!validateStartPoint()) {
      return;
    }

    routePlanMutation.reset();
    setPlannerAssistError(undefined);
    const startPointName = startPoint.trim();
    let resolvedStartPosition = startPointPosition;
    if (!resolvedStartPosition) {
      try {
        resolvedStartPosition = await resolveStartPointPosition(
          city.name,
          startPointName,
        );
      } catch (error) {
        messageApi.error(
          error instanceof Error ? error.message : "起点解析失败，请重新选择",
        );
        return;
      }
    }
    const lunchLocation = config
      ? await resolveOptionalPlanLocation(
          city.name,
          config.lunchMode,
          config.lunchPlaceName,
          "午餐地点",
          config.lunchLocation,
          tripCenterPoint,
        )
      : undefined;
    const restLocation = config
      ? await resolveOptionalPlanLocation(
          city.name,
          config.restMode,
          config.restPlaceName,
          "休息地点",
          config.restLocation,
          tripCenterPoint,
        )
      : undefined;
    const hotelLocation = config
      ? await resolveOptionalPlanLocation(
          city.name,
          config.hotelMode,
          config.hotelName,
          "酒店地点",
          config.hotelLocation,
          tripCenterPoint,
        )
      : undefined;
    const result = await routePlanMutation.mutateAsync({
      cityId: city.id,
      startPoint: {
        name: startPointName,
        position: resolvedStartPosition,
      },
      spotIds: tripSpots.map((spot) => spot.id),
      transportType: selectedTransport,
      planMode: selectedPlanMode,
      tripDays: config?.tripDays,
      dailyStartTime: config?.dailyStartTime,
      dailyEndTime: config?.dailyEndTime,
      includeLunchBreak: config?.includeLunchBreak,
      includeNightTour: config?.includeNightTour,
      intensity: config?.intensity,
      lunchMode: config?.lunchMode,
      lunchLocation,
      restMode: config?.restMode,
      restLocation,
      hotelMode: config?.hotelMode,
      hotelLocation,
      returnToHotel: config?.returnToHotel,
    });
    setActiveTripId(undefined);
    setActiveShareToken(undefined);
    setRoutePlanResult(result);
    clearSavedTripReplayParam();
    if (result.planMode === "schedule" && result.itineraryDays.length > 0) {
      setSelectedScheduleDay(result.itineraryDays[0].dayIndex);
    }
  }

  /**
   * 起点为空属于表单校验问题，使用顶部消息提示，避免渲染“行程规划失败”结果组件。
   */
  function validateStartPoint() {
    if (startPoint.trim()) {
      return true;
    }

    routePlanMutation.reset();
    setPlannerAssistError(undefined);
    messageApi.error("请填写起点，或点击输入框左侧的“定位”使用当前位置");
    return false;
  }

  /**
   * 展示保存成功通知，由用户主动决定是否进入个人行程页。
   */
  function showTripSavedNotification() {
    const notificationKey = "trip-saved-success";
    notificationApi.success({
      key: notificationKey,
      message: "行程保存成功",
      description:
        "已保存到“我的行程”，你可以继续查看地图或进入个人行程页管理。",
      duration: 4,
      placement: "topLeft",
      actions: (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            notificationApi.destroy(notificationKey);
            navigate("/trips");
          }}
        >
          查看我的行程
        </Button>
      ),
    });
  }

  /**
   * 保存当前已生成的路线结果，默认停留在工作台并弹出可跳转通知。
   */
  async function handleSaveCurrentTrip(options?: { notify?: boolean }) {
    if (!authToken) {
      setAuthError(undefined);
      setAuthDialogOpen(true);
      return;
    }
    if (!city || !routePlanResult) {
      return;
    }

    try {
      const payload = buildSaveTripPayload({
        city,
        routePlan: routePlanResult,
        tripSpots,
        startPoint: startPoint.trim() || `${city.name}市中心`,
        startPointPosition:
          visibleRouteSegments?.[0]?.fromPosition ??
          startPointPosition ??
          city.center,
        scheduleConfig,
      });
      const tripId = await saveUserTripMutation.mutateAsync(payload);
      setActiveTripId(tripId);
      await queryClient.invalidateQueries({ queryKey: ["user-trips"] });
      if (options?.notify !== false) {
        showTripSavedNotification();
      }
      return tripId;
    } catch (error) {
      if (options?.notify !== false) {
        messageApi.error(
          error instanceof Error ? error.message : "请稍后再尝试保存行程。",
        );
      }
      return undefined;
    }
  }

  /**
   * 分享行程时先确保已保存，再开启公开分享并返回 shareToken。
   */
  async function handleCreatePublicShareLink() {
    let tripId = activeTripId;
    if (!tripId) {
      tripId = await handleSaveCurrentTrip({ notify: false });
    }
    if (!tripId) {
      return undefined;
    }

    const shareResult = await updateUserTripShareMutation.mutateAsync({
      tripId,
      enabled: true,
    });
    setActiveTripId(shareResult.tripId);
    setActiveShareToken(shareResult.shareToken ?? null);
    return shareResult.shareToken;
  }

  /**
   * 保存已落库行程的名称；未保存的新行程只更新本地配置状态。
   */
  async function handleSaveActiveTripName(tripName: string) {
    const nextTripName = tripName.trim();
    if (!nextTripName || !activeTripId) {
      return;
    }
    await updateUserTripNameMutation.mutateAsync({
      tripId: activeTripId,
      tripName: nextTripName,
    });
    await queryClient.invalidateQueries({ queryKey: ["user-trips"] });
    await queryClient.invalidateQueries({
      queryKey: ["user-trip-detail", activeTripId],
    });
    messageApi.success("行程名称已更新");
  }

  /**
   * 用户只输入地点名称时，先尝试用百度地点检索解析成坐标。
   * 当前取第一候选项，优先使用更适合导航落点的 naviLocation。
   */
  async function resolveStartPointPosition(
    cityName: string,
    keyword: string,
  ) {
    if (!keyword.trim()) {
      throw new Error("请填写起点，或使用当前位置");
    }

    try {
      const fallbackCandidates = poiCandidatesQuery.data?.length
        ? poiCandidatesQuery.data
        : await fetchPoiCalibrationCandidates(
            normalizeCityName(cityName),
            keyword.trim(),
          );
      const firstCandidate = fallbackCandidates[0];
      if (firstCandidate) {
        const candidatePosition =
          firstCandidate.naviLocation ?? firstCandidate.location;
        if (candidatePosition) {
          return candidatePosition;
        }
      }
    } catch {
      throw new Error("起点检索失败，请选择联想结果或在地图上选点");
    }

    throw new Error("未找到该起点，请输入更具体的地点名称");
  }

  // 完整行程的手动地点输入会在提交前统一解析，避免把“只写名称”的地点直接交给后端。
  async function resolveOptionalPlanLocation(
    cityName: string,
    mode: LocationArrangeMode,
    placeName: string,
    label: string,
    selectedLocation?: RouteLocation,
    referencePoint?: GeoPoint,
  ): Promise<RouteLocation | undefined> {
    if (mode !== "manual") {
      return undefined;
    }

    const keyword = placeName.trim();
    if (!keyword) {
      throw new Error(`${label}不能为空`);
    }

    if (selectedLocation && selectedLocation.name === keyword) {
      return selectedLocation;
    }

    const candidates = await fetchPoiCalibrationCandidates(
      normalizeCityName(cityName),
      keyword,
    );
    const firstCandidate = pickBestPoiCandidate(candidates, referencePoint);
    const position =
      firstCandidate?.naviLocation ?? firstCandidate?.location ?? undefined;
    if (!firstCandidate || !position) {
      throw new Error(`${label}未命中候选地点，请换一个更具体的名称`);
    }

    return {
      name: firstCandidate.name,
      position,
      address: firstCandidate.address,
    };
  }

  // 用户从联想结果里选中起点时，直接绑定名称和对应坐标。
  function handleSelectStartPoint(value: string, position?: GeoPoint) {
    setRoutePlanResult(undefined);
    setPlannerAssistError(undefined);
    setStartPoint(value);
    setStartPointPosition(position);
    setStartPointPicking(false);
  }

  // 用户改写手动地点名称后，清除旧坐标，避免名称和地点对象不一致。
  function handleManualScheduleFieldChange(
    field: "hotelName" | "lunchPlaceName" | "restPlaceName",
    locationField: "hotelLocation" | "lunchLocation" | "restLocation",
    nextValue: string,
  ) {
    setScheduleConfig((current) => ({
      ...current,
      [field]: nextValue,
      [locationField]:
        current[locationField]?.name === nextValue
          ? current[locationField]
          : undefined,
    }));
  }

  // 选中联想结果时同步保存名称、坐标和地址，提交时优先使用该精确地点。
  function handleSelectManualScheduleLocation(
    field: "hotelName" | "lunchPlaceName" | "restPlaceName",
    locationField: "hotelLocation" | "lunchLocation" | "restLocation",
    location: RouteLocation,
  ) {
    setScheduleConfig((current) => ({
      ...current,
      [field]: location.name,
      [locationField]: location,
    }));
  }

  // 地图点击选点会回填起点名称和坐标；名称优先使用百度前端反查结果。
  const handlePickMapStartPoint = useCallback(
    (target: { name: string; position: GeoPoint }) => {
      setRoutePlanResult(undefined);
      setPlannerAssistError(undefined);
      setStartPoint(target.name);
      setStartPointPosition(target.position);
      setStartPointPicking(false);
    },
    [],
  );

  // 浏览器当前位置会先从 WGS-84 转为 GCJ-02，再作为路线规划起点提交。
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setPlannerAssistError("当前浏览器不支持定位，请手动输入起点");
      return;
    }

    setLocatingCurrentPosition(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gcjPoint = wgs84ToGcj02({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
        setRoutePlanResult(undefined);
        setPlannerAssistError(undefined);
        setStartPoint("我的位置");
        setStartPointPosition(gcjPoint);
        setStartPointPicking(false);
        setLocatingCurrentPosition(false);
      },
      () => {
        setPlannerAssistError("定位失败，请检查定位权限或手动输入起点");
        setLocatingCurrentPosition(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }

  // 顶部“我的位置”只负责地图视角定位；城市切换依据百度逆地理编码返回的真实城市名。
  function handleFocusCurrentLocation() {
    if (!navigator.geolocation) {
      setPlannerAssistError("当前浏览器不支持定位，无法获取我的位置");
      return;
    }

    setLocatingCurrentPosition(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void focusCurrentLocationByBrowserPosition(position);
      },
      () => {
        setPlannerAssistError("定位失败，请检查浏览器定位权限");
        setLocatingCurrentPosition(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }

  // 浏览器只给经纬度，城市归属需要交给百度逆地理编码判断，再与当前下拉城市列表匹配。
  async function focusCurrentLocationByBrowserPosition(
    position: GeolocationPosition,
  ) {
    try {
      const currentPosition = wgs84ToGcj02({
        lng: position.coords.longitude,
        lat: position.coords.latitude,
      });
      const locatedCity = await reverseGeocodeCityByPosition(currentPosition);
      const matchedCity = locatedCity
        ? findKnownCityByLocation(locatedCity, cities)
        : undefined;

      setPlannerAssistError(undefined);
      setCurrentLocationPosition(currentPosition);
      setMapFocusTarget({
        key: `current-location-${Date.now()}`,
        position: currentPosition,
        zoom: 15,
      });

      if (matchedCity && matchedCity.id !== city?.id) {
        handleCityChange(matchedCity.id);
        setMapFocusTarget({
          key: `current-location-city-${Date.now()}`,
          position: currentPosition,
          zoom: 15,
        });
        messageApi.success(`已根据当前位置切换到${matchedCity.name}`);
        return;
      }

      if (locatedCity && !matchedCity) {
        messageApi.warning(
          `${locatedCity.city || locatedCity.province}暂未收录，已定位到当前位置`,
        );
        return;
      }

      if (matchedCity) {
        messageApi.success("已定位到我的位置");
        return;
      }

      messageApi.warning("无法识别当前位置所在城市，已定位到当前位置");
    } catch (error) {
      setPlannerAssistError(
        error instanceof Error ? error.message : "定位城市识别失败",
      );
    } finally {
      setLocatingCurrentPosition(false);
    }
  }

  // 右侧完整行程时间轴点击地点时，地图聚焦到该地点；景点同时同步左侧和地图选中态。
  function handleFocusRouteTimelineLocation(target: RouteTimelineFocusTarget) {
    // 如果是景点，则同步选中态和URL参数。
    if (target.spotId) {
      setSelectedSpotId(target.spotId);
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set("spotId", String(target.spotId));
        return nextParams;
      });
    }

    setMapFocusTarget({
      key: `${target.key}-${Date.now()}`,
      position: target.position,
      zoom: 16,
    });
  }

  return (
    <main className={styles.workbenchShell}>
      {messageContextHolder}
      {notificationContextHolder}
      <WorkbenchHeader
        cities={cities}
        selectedCityId={activeCityId}
        cityName={city?.name ?? "城市数据不可用"}
        tags={tags}
        searchKeyword={searchKeyword}
        activeFilter={activeFilter}
        currentUser={currentUserQuery.data}
        onCityChange={handleCityChange}
        onSearchKeywordChange={setSearchKeyword}
        onActiveFilterChange={setActiveFilter}
        onAuthClick={() => {
          setAuthError(undefined);
          setAuthDialogOpen(true);
        }}
        locatingCurrentPosition={locatingCurrentPosition}
        onLocateCurrentPosition={handleFocusCurrentLocation}
        onFavoritesClick={() => {
          if (!authToken) {
            setAuthError(undefined);
            setAuthDialogOpen(true);
            return;
          }
          navigate("/favorites");
        }}
        onTripsClick={() => {
          if (!authToken) {
            setAuthError(undefined);
            setAuthDialogOpen(true);
            return;
          }
          navigate("/trips");
        }}
        onLogout={handleLogout}
      />

      <section className={styles.mapWorkspace} aria-label="地图工作台主体">
        <BaiduMapStage
          city={city}
          dataUnavailable={Boolean(pageError)}
          spots={visibleSpots}
          selectedSpot={selectedSpot}
          selectedSpotId={effectiveSelectedSpotId}
          routeSegments={visibleRouteSegments}
          routeOverlays={mapRouteOverlays}
          itineraryMarkers={mapItineraryMarkers}
          focusTarget={mapFocusTarget}
          startPointPicking={startPointPicking}
          startPointPosition={startPointPosition}
          currentLocationPosition={currentLocationPosition}
          onSelectSpot={(spotId) => {
            setSelectedSpotId(spotId);
            setSearchParams((currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              nextParams.set("spotId", String(spotId));
              return nextParams;
            });
          }}
          onPickStartPoint={handlePickMapStartPoint}
        />
        {/* 完整行程顶部天数切换 */}
        {showingScheduleResult ? (
          <div className={styles.scheduleDayTabsPanel}>
            <Segmented
              value={activeScheduleDay?.dayIndex}
              options={routePlanResult.itineraryDays.map((day) => ({
                label: (
                  <div className={styles.scheduleDayTab}>
                    <strong>{`Day ${day.dayIndex}`}</strong>
                    <span>{day.spots.length} 个景点</span>
                  </div>
                ),
                value: day.dayIndex,
              }))}
              onChange={(value) => setSelectedScheduleDay(value as number)}
            />
          </div>
        ) : null}

        {!showingScheduleResult ? (
          <div className={styles.leftFloatPanel}>
            {spots.length === 0 || !city ? (
              <aside className={styles.inlineStatePanel}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    pageError
                      ? "景点数据暂不可用，可继续浏览地图"
                      : "当前城市暂无景点数据"
                  }
                />
              </aside>
            ) : (
              <SpotRecommendList
                cityName={city.name}
                spots={visibleSpots}
                tags={tags}
                activeTab={activeRecommendTab}
                selectedSpotId={effectiveSelectedSpotId}
                onActiveTabChange={setActiveRecommendTab}
                onSelectSpot={(spotId) => {
                  setSelectedSpotId(spotId);
                  setSearchParams((currentParams) => {
                    const nextParams = new URLSearchParams(currentParams);
                    nextParams.set("spotId", String(spotId));
                    return nextParams;
                  });
                }}
                onDragSpotStart={handleDragRecommendSpot}
              />
            )}
          </div>
        ) : null}

        {selectedSpot && !routePlanResult ? (
          <div className={styles.detailFloatPanel}>
            <Suspense fallback={null}>
              <SpotDetailPanel
                favoriteLoading={
                  favoriteSpotMutation.isPending ||
                  unfavoriteSpotMutation.isPending
                }
                checkinLoading={
                  checkinSpotMutation.isPending ||
                  uncheckinSpotMutation.isPending
                }
                isCheckedIn={checkinSpotStatusQuery.data?.checkedIn ?? false}
                isFavorite={favoriteSpotStatusQuery.data?.favorited ?? false}
                isLoggedIn={Boolean(authToken)}
                spot={selectedSpot}
                tags={tags}
                nearbySpots={nearbySpots}
                isInTrip={tripSpotIds.includes(selectedSpot.id)}
                onAddToTrip={handleAddToTrip}
                onToggleCheckin={handleToggleCheckin}
                onToggleFavorite={handleToggleFavorite}
                onSelectSpot={(spotId) => {
                  setSelectedSpotId(spotId);
                  setSearchParams((currentParams) => {
                    const nextParams = new URLSearchParams(currentParams);
                    nextParams.set("spotId", String(spotId));
                    return nextParams;
                  });
                }}
              />
            </Suspense>
          </div>
        ) : null}

        {routePlanResult && city ? (
          <div className={styles.routeDrawerPanel}>
            <Suspense fallback={null}>
              <RoutePlanDrawer
                cityName={city.name}
                routePlan={routePlanResult}
                tripSpots={tripSpots}
                tags={tags}
                startPoint={startPoint.trim() || `${city.name}市中心`}
                startPosition={
                  visibleRouteSegments?.[0]?.fromPosition ??
                  startPointPosition ??
                  city.center
                }
                scheduleStartTime={
                  showingScheduleResult
                    ? scheduleConfig.dailyStartTime
                    : undefined
                }
                selectedDayIndex={activeScheduleDay?.dayIndex}
                shareToken={activeShareToken}
                saving={
                  saveUserTripMutation.isPending ||
                  updateUserTripShareMutation.isPending
                }
                onFocusLocation={handleFocusRouteTimelineLocation}
                onCreateShareLink={handleCreatePublicShareLink}
                onSaveTrip={() => handleSaveCurrentTrip()}
                onClose={() => {
                  setRoutePlanResult(undefined);
                  clearSavedTripReplayParam();
                }}
              />
            </Suspense>
          </div>
        ) : null}

        {showingScheduleResult ? (
          <div className={styles.scheduleSettingsFab}>
            <Tooltip title="行程设置" placement="right">
              <Button
                type="default"
                shape="circle"
                size="large"
                icon={<SettingOutlined />}
                onClick={() => setScheduleSettingsOpen(true)}
              />
            </Tooltip>
          </div>
        ) : null}

        <div className={styles.tripFloatPanel}>
          <TripPlannerDock
            tripSpots={tripSpots}
            transportTypes={transportTypes}
            planModes={planModes}
            startPoint={startPoint}
            startPointOptions={startPointOptions}
            selectedTransport={selectedTransport}
            selectedPlanMode={selectedPlanMode}
            planning={routePlanMutation.isPending}
            locatingCurrentPosition={locatingCurrentPosition}
            dragOverTrip={dragOverTripDock}
            startPointPicking={startPointPicking}
            planResult={routePlanResult}
            planError={
              (routePlanMutation.error instanceof Error
                ? routePlanMutation.error.message
                : undefined) ?? plannerAssistError
            }
            onStartPointChange={(value) => {
              setRoutePlanResult(undefined);
              setPlannerAssistError(undefined);
              setStartPoint(value);
              setStartPointPosition(undefined);
              setStartPointPicking(false);
            }}
            onStartPointFocus={() => setStartPointPicking(true)}
            onSelectStartPoint={handleSelectStartPoint}
            onUseCurrentLocation={handleUseCurrentLocation}
            onTransportChange={(value) => {
              setRoutePlanResult(undefined);
              setSelectedTransport(value);
            }}
            onPlanModeChange={(value) => {
              setRoutePlanResult(undefined);
              setSelectedPlanMode(value);
            }}
            onPlanRoute={handlePlanRoute}
            onRemoveSpot={handleRemoveTripSpot}
            onReorderSpot={handleReorderTripSpot}
            onDropRecommendSpot={handleDropRecommendSpot}
            onTripDragOver={handleTripDockDragOver}
            onTripDragLeave={() => setDragOverTripDock(false)}
            onClearTrip={() => {
              setTripSpotIds([]);
              setRoutePlanResult(undefined);
              clearSavedTripReplayParam();
            }}
          />
        </div>
      </section>

      <Modal
        title="完整行程配置"
        open={scheduleConfigModalOpen}
        width={860}
        okText={scheduleConfigStep === 2 ? "生成完整行程" : "下一步"}
        cancelText="取消"
        confirmLoading={routePlanMutation.isPending}
        onOk={() => {
          if (scheduleConfigStep < 2) {
            setScheduleConfigStep((currentStep) => currentStep + 1);
            return;
          }
          void handleSubmitSchedulePlan();
        }}
        onCancel={() => {
          setScheduleConfigModalOpen(false);
          setScheduleConfigStep(0);
        }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <div className={styles.scheduleModalFooter}>
            <CancelBtn />
            {scheduleConfigStep > 0 ? (
              <Button
                onClick={() =>
                  setScheduleConfigStep((currentStep) => currentStep - 1)
                }
              >
                上一步
              </Button>
            ) : null}
            <OkBtn />
          </div>
        )}
      >
        <div className={styles.scheduleDialogIntro}>
          <span>按行程信息、偏好设置、生成确认三步完成配置。</span>
        </div>
        {scheduleConfigModalOpen && city ? (
          <Suspense fallback={null}>
            <SchedulePlanFormFields
              value={scheduleConfig}
              cityName={city.name}
              tripSpots={tripSpots}
              currentStep={scheduleConfigStep}
              onChange={setScheduleConfig}
              onRemoveSpot={handleRemoveTripSpot}
              hotelOptions={hotelOptions}
              lunchOptions={lunchOptions}
              restOptions={restOptions}
              onHotelNameChange={(value) =>
                handleManualScheduleFieldChange(
                  "hotelName",
                  "hotelLocation",
                  value,
                )
              }
              onLunchPlaceNameChange={(value) =>
                handleManualScheduleFieldChange(
                  "lunchPlaceName",
                  "lunchLocation",
                  value,
                )
              }
              onRestPlaceNameChange={(value) =>
                handleManualScheduleFieldChange(
                  "restPlaceName",
                  "restLocation",
                  value,
                )
              }
              onHotelSelect={(location) =>
                handleSelectManualScheduleLocation(
                  "hotelName",
                  "hotelLocation",
                  location,
                )
              }
              onLunchSelect={(location) =>
                handleSelectManualScheduleLocation(
                  "lunchPlaceName",
                  "lunchLocation",
                  location,
                )
              }
              onRestSelect={(location) =>
                handleSelectManualScheduleLocation(
                  "restPlaceName",
                  "restLocation",
                  location,
                )
              }
            />
          </Suspense>
        ) : null}
      </Modal>

      {city && (scheduleSettingsOpen || routePlanResult) ? (
        <Suspense fallback={null}>
          <ScheduleResultSettingsDrawer
            open={scheduleSettingsOpen}
            loading={routePlanMutation.isPending}
            savingTripName={updateUserTripNameMutation.isPending}
            cityName={city.name}
            value={scheduleConfig}
            routePlan={routePlanResult}
            tripSpots={tripSpots}
            onChange={setScheduleConfig}
            onClose={() => setScheduleSettingsOpen(false)}
            onTripNameSave={handleSaveActiveTripName}
            onRegenerate={async () => {
              setScheduleSettingsOpen(false);
              await submitRoutePlan(scheduleConfig);
            }}
          />
        </Suspense>
      ) : null}

      {authDialogOpen ? (
        <Suspense fallback={null}>
          <AuthDialog
            open={authDialogOpen}
            loading={loginMutation.isPending || registerMutation.isPending}
            error={authError}
            onClose={() => {
              setAuthDialogOpen(false);
              setAuthError(undefined);
            }}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        </Suspense>
      ) : null}
    </main>
  );
}

interface MapRouteOverlay {
  key: string;
  polyline: GeoPoint[];
  color: string;
  lineStyle: "solid" | "dashed";
  kind: "route" | "guide";
}

interface MapFocusTarget {
  key: string;
  position: GeoPoint;
  zoom?: number;
}

interface MapItineraryMarker {
  key: string;
  position: GeoPoint;
  itemType: "lunch" | "rest" | "hotel";
  title: string;
}

// 我的规划详情是持久化结构，这里转换成地图工作台既有的路线规划展示结构。
function buildRoutePlanFromSavedTrip(
  trip: UserTripDetailDto,
): RoutePlanResponseDto {
  const segments = trip.routeSegments
    .slice()
    .sort((left, right) =>
      left.dayIndex === right.dayIndex
        ? left.segmentIndex - right.segmentIndex
        : left.dayIndex - right.dayIndex,
    )
    .map(mapSavedTripSegment)
    .filter((segment): segment is RouteSegmentDto => Boolean(segment));
  const spotStayPlans = trip.itineraryDays.flatMap((day) =>
    day.items
      .filter(
        (item): item is UserTripItemDetailDto & { spotId: number } =>
          item.itemType === "spot" && item.spotId != null,
      )
      .map((item) => ({
        spotId: item.spotId,
        spotName: item.itemName,
        suggestedDurationMinutes: item.suggestedDuration ?? 0,
        suggestedStartTime: item.startTime ?? undefined,
        suggestedEndTime: item.endTime ?? undefined,
        dayIndex: day.dayIndex,
      })),
  );

  return {
    routeRecordId: trip.routeRecordId ?? undefined,
    cityId: trip.cityId,
    transportType: trip.transportType,
    planMode: trip.planMode,
    routeSummary: buildSavedTripSummary(trip),
    orderedSpotIds: resolveSavedTripSpotIds(trip),
    totalDistanceMeters: trip.totalDistance,
    totalTravelDurationSeconds: segments.reduce(
      (total, segment) => total + segment.durationSeconds,
      0,
    ),
    totalStayDurationMinutes: spotStayPlans.reduce(
      (total, spot) => total + spot.suggestedDurationMinutes,
      0,
    ),
    totalTripDurationMinutes: trip.totalDuration,
    spotStayPlans,
    segments,
    itineraryDays: trip.itineraryDays.map((day) =>
      buildSavedTripItineraryDay(trip, day.dayIndex, spotStayPlans),
    ),
  };
}

function buildSavedTripItineraryDay(
  trip: UserTripDetailDto,
  dayIndex: number,
  spotStayPlans: RoutePlanResponseDto["spotStayPlans"],
) {
  const day = trip.itineraryDays.find((item) => item.dayIndex === dayIndex)!;
  const daySegments = trip.routeSegments
    .filter((segment) => segment.dayIndex === dayIndex)
    .sort((left, right) => left.segmentIndex - right.segmentIndex)
    .map(mapSavedTripSegment)
    .filter((segment): segment is RouteSegmentDto => Boolean(segment));
  const items = day.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(mapSavedTripItem);
  const daySpotPlans = spotStayPlans.filter(
    (spotPlan) => spotPlan.dayIndex === dayIndex,
  );

  return {
    dayIndex,
    title: `Day ${dayIndex}`,
    startTime: items[0]?.suggestedStartTime ?? "09:00",
    startPlaceName:
      dayIndex === 1
        ? trip.startName || `${trip.cityName}市中心`
        : `Day ${dayIndex} 出发`,
    totalDistanceMeters: daySegments.reduce(
      (total, segment) => total + segment.distanceMeters,
      0,
    ),
    totalTravelDurationSeconds: daySegments.reduce(
      (total, segment) => total + segment.durationSeconds,
      0,
    ),
    totalStayDurationMinutes: items.reduce(
      (total, item) => total + item.durationMinutes,
      0,
    ),
    totalTripDurationMinutes: calculateSavedDayTotalMinutes(items),
    spots: daySpotPlans,
    items,
    segments: daySegments,
  };
}

function mapSavedTripSegment(
  segment: UserTripRouteSegmentDetailDto,
): RouteSegmentDto | undefined {
  const fromPosition = resolveSavedSegmentCoordinate(segment, "from");
  const toPosition = resolveSavedSegmentCoordinate(segment, "to");
  if (!fromPosition || !toPosition) {
    return undefined;
  }

  const polyline = parseSavedPolyline(segment.polyline);
  return {
    segmentIndex: segment.segmentIndex,
    fromName: segment.fromName,
    fromPosition,
    toName: segment.toName,
    toPosition,
    transportType: segment.transportType,
    distanceMeters: segment.distance,
    durationSeconds: segment.duration,
    instruction: segment.instruction,
    polyline: polyline.length >= 2 ? polyline : [fromPosition, toPosition],
    stepTexts: parseSavedSteps(segment.stepsJson),
  };
}

function mapSavedTripItem(item: UserTripItemDetailDto): ItineraryItemDto {
  return {
    sequence: item.sortOrder,
    itemType: item.itemType,
    title: item.itemName,
    placeName: item.itemName,
    placeType: resolveSavedTripPlaceType(item.itemType),
    position:
      item.lng != null && item.lat != null
        ? { lng: item.lng, lat: item.lat }
        : undefined,
    durationMinutes: item.suggestedDuration ?? 0,
    suggestedStartTime: item.startTime ?? "",
    suggestedEndTime: item.endTime ?? "",
    relatedSpotId: item.spotId ?? undefined,
  };
}

function resolveSavedTripSpotIds(trip: UserTripDetailDto) {
  return trip.itineraryDays.flatMap((day) =>
    day.items
      .filter((item) => item.itemType === "spot" && item.spotId != null)
      .map((item) => item.spotId!),
  );
}

function parsePositiveNumber(value: string | null) {
  const numberValue = value ? Number(value) : undefined;
  return numberValue && Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : undefined;
}

// 兼容后端当前 fromLng/fromLat 字段，以及早期前端草案中的 fromPosition 对象字段。
function resolveSavedSegmentCoordinate(
  segment: UserTripRouteSegmentDetailDto,
  direction: "from" | "to",
): GeoPoint | undefined {
  const objectPoint =
    direction === "from" ? segment.fromPosition : segment.toPosition;
  if (isGeoPoint(objectPoint)) {
    return objectPoint;
  }

  const lng = parseCoordinateNumber(
    direction === "from" ? segment.fromLng : segment.toLng,
  );
  const lat = parseCoordinateNumber(
    direction === "from" ? segment.fromLat : segment.toLat,
  );
  if (lng == null || lat == null) {
    return undefined;
  }

  return { lng, lat };
}

function parseCoordinateNumber(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseSavedPolyline(value: string): GeoPoint[] {
  try {
    const parsed = JSON.parse(value) as GeoPoint[];
    return Array.isArray(parsed) ? parsed.filter(isGeoPoint) : [];
  } catch {
    return [];
  }
}

function parseSavedSteps(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function isGeoPoint(value: unknown): value is GeoPoint {
  return (
    typeof value === "object" &&
    value != null &&
    typeof (value as GeoPoint).lng === "number" &&
    typeof (value as GeoPoint).lat === "number"
  );
}

function calculateSavedDayTotalMinutes(items: ItineraryItemDto[]) {
  const firstTime = parseClockText(items[0]?.suggestedStartTime);
  const lastTime = parseClockText(items[items.length - 1]?.suggestedEndTime);
  if (firstTime != null && lastTime != null && lastTime >= firstTime) {
    return lastTime - firstTime;
  }

  return items.reduce((total, item) => total + item.durationMinutes, 0);
}

function parseClockText(value?: string) {
  if (!value) {
    return undefined;
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return undefined;
  }
  return hour * 60 + minute;
}

function resolveSavedTripPlaceType(
  itemType: UserTripItemDetailDto["itemType"],
) {
  switch (itemType) {
    case "lunch":
      return "用餐";
    case "rest":
      return "休息";
    case "hotel":
      return "住宿";
    default:
      return "景点";
  }
}

function buildSavedTripSummary(trip: UserTripDetailDto) {
  return `从${trip.startName || trip.cityName}出发，回放已保存的${trip.planMode === "schedule" ? "完整行程" : "自由路线"}。`;
}

function buildMapRouteOverlays(
  routePlanResult?: RoutePlanResponseDto,
  visibleRouteSegments?: RouteSegmentDto[],
  activeDay?: RoutePlanResponseDto["itineraryDays"][number],
): MapRouteOverlay[] | undefined {
  if (!routePlanResult) {
    return undefined;
  }

  const auxiliaryItemMap = activeDay
    ? buildMapAuxiliaryItemMap(activeDay.items)
    : new Map<string, ItineraryItemDto>();
  const overlays: MapRouteOverlay[] = (
    visibleRouteSegments ?? routePlanResult.segments
  )
    .filter((segment) => segment.polyline.length >= 2)
    .map((segment, index) => {
      const auxiliarySegment = isMapAuxiliarySegment(segment, auxiliaryItemMap);
      return {
        key: `segment-${segment.segmentIndex}`,
        polyline: segment.polyline,
        color: auxiliarySegment
          ? getMapAuxiliarySegmentColor(segment, auxiliaryItemMap)
          : getRouteColor(index),
        lineStyle: auxiliarySegment ? ("dashed" as const) : ("solid" as const),
        kind: auxiliarySegment ? ("guide" as const) : ("route" as const),
      };
    });

  return overlays;
}

function buildMapAuxiliaryItemMap(items: ItineraryItemDto[]) {
  const itemMap = new Map<string, ItineraryItemDto>();
  items.forEach((item) => {
    if (isMapAuxiliaryItem(item)) {
      itemMap.set(normalizeMapPlaceName(item.placeName || item.title), item);
    }
  });
  return itemMap;
}

function isMapAuxiliaryItem(
  item: ItineraryItemDto,
): item is ItineraryItemDto & { itemType: "lunch" | "rest" | "hotel" } {
  return (
    item.itemType === "lunch" ||
    item.itemType === "rest" ||
    item.itemType === "hotel"
  );
}

function isMapAuxiliarySegment(
  segment: RouteSegmentDto,
  auxiliaryItemMap: Map<string, ItineraryItemDto>,
) {
  return (
    auxiliaryItemMap.has(normalizeMapPlaceName(segment.fromName)) ||
    auxiliaryItemMap.has(normalizeMapPlaceName(segment.toName))
  );
}

function getMapAuxiliarySegmentColor(
  segment: RouteSegmentDto,
  auxiliaryItemMap: Map<string, ItineraryItemDto>,
) {
  const targetItem =
    auxiliaryItemMap.get(normalizeMapPlaceName(segment.toName)) ??
    auxiliaryItemMap.get(normalizeMapPlaceName(segment.fromName));

  if (targetItem && isMapAuxiliaryItem(targetItem)) {
    return getItineraryActivityColor(targetItem.itemType);
  }

  return "#7a8ca4";
}

function resolveScheduleMapSegments(
  routePlanResult: RoutePlanResponseDto,
  activeDay: RoutePlanResponseDto["itineraryDays"][number],
) {
  if (activeDay.segments?.length) {
    return activeDay.segments;
  }

  const dayTargetNames = activeDay.items
    .filter((item) => item.position)
    .map((item) => normalizeMapPlaceName(item.placeName || item.title));
  let searchStartIndex = 0;
  const matchedSegments: RouteSegmentDto[] = [];

  dayTargetNames.forEach((targetName) => {
    const matchedIndex = routePlanResult.segments.findIndex(
      (segment, index) =>
        index >= searchStartIndex &&
        normalizeMapPlaceName(segment.toName) === targetName,
    );
    if (matchedIndex >= 0) {
      matchedSegments.push(routePlanResult.segments[matchedIndex]);
      searchStartIndex = matchedIndex + 1;
    }
  });

  return matchedSegments;
}

function normalizeMapPlaceName(placeName: string) {
  return placeName.trim().replace(/\s+/g, "").toLowerCase();
}

function buildMapItineraryMarkers(
  activeItems?: ItineraryItemDto[],
): MapItineraryMarker[] | undefined {
  const markers = (activeItems ?? [])
    .filter(
      (
        item,
      ): item is ItineraryItemDto & {
        position: GeoPoint;
        itemType: "lunch" | "rest" | "hotel";
      } => item.itemType !== "spot" && Boolean(item.position),
    )
    .map((item) => ({
      key: `${item.itemType}-${item.sequence}`,
      position: item.position,
      itemType: item.itemType,
      title: item.placeName || item.title,
    }));

  return markers.length ? markers : undefined;
}

function getRouteColor(index: number) {
  const ROUTE_SEGMENT_COLORS = [
    "#2d6bff",
    "#20a95a",
    "#f08b2f",
    "#7a5af8",
    "#ef5da8",
  ];
  return ROUTE_SEGMENT_COLORS[index % ROUTE_SEGMENT_COLORS.length];
}

function reorderByIndex<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function mapCity(city?: TravelCity | TravelCityDto) {
  if (!city) {
    return undefined;
  }

  return {
    id: city.id,
    name: city.name,
    provinceName: city.provinceName,
    cityCode: city.cityCode,
    center: city.center,
    mapZoom: city.mapZoom,
    description: city.description,
    recommendDays: city.recommendDays,
  } satisfies TravelCity;
}

function mapTag(tag: SpotTagDto): SpotTag {
  return {
    id: tag.id,
    name: tag.name,
    code: tag.code,
    sortOrder: tag.sortOrder,
  };
}

function mapSpot(spot: TravelSpotSummaryDto, city?: TravelCity): TravelSpot {
  return {
    id: spot.id,
    cityId: spot.cityId,
    name: spot.name,
    type: spot.type,
    position: spot.position,
    address: spot.address,
    coverUrl: spot.coverUrl,
    summary: spot.summary,
    recommendReason: spot.recommendReason,
    openingHours: spot.openingHours,
    ticketInfo: spot.ticketInfo,
    suggestedDurationMinutes: spot.suggestedDurationMinutes,
    bestTime: spot.bestTime,
    recommendScore: spot.recommendScore,
    distanceText: formatDistanceText(city, spot.position),
    tags: spot.tags.map((tag) => tag.code as SpotTagCode),
  };
}

function mergeSpotDetail(
  spot: TravelSpot | undefined,
  detail: TravelSpotDetailDto | undefined,
  city?: TravelCity,
): TravelSpot | undefined {
  if (!spot && !detail) {
    return undefined;
  }

  if (!detail) {
    return spot;
  }

  return {
    id: detail.id,
    cityId: detail.cityId,
    name: detail.name,
    type: detail.type,
    position: detail.position,
    address: detail.address,
    coverUrl: detail.coverUrl,
    summary: detail.summary,
    recommendReason: detail.recommendReason,
    openingHours: detail.openingHours,
    ticketInfo: detail.ticketInfo,
    suggestedDurationMinutes: detail.suggestedDurationMinutes,
    bestTime: detail.bestTime,
    recommendScore: detail.recommendScore,
    distanceText:
      spot?.distanceText ?? formatDistanceText(city, detail.position),
    tags: detail.tags.map((tag) => tag.code as SpotTagCode),
    boundary: detail.boundary,
    description: detail.description,
    travelGuide: detail.travelGuide,
  };
}

function formatDistanceText(
  city: TravelCity | undefined,
  point: { lng: number; lat: number },
) {
  if (!city) {
    return "--";
  }

  const lngDelta = point.lng - city.center.lng;
  const latDelta = point.lat - city.center.lat;
  const distance = Math.sqrt(lngDelta * lngDelta + latDelta * latDelta) * 111;
  return `${distance.toFixed(1)}km`;
}

/**
 * 格式化日期偏移量
 * @param offsetDays
 * @returns
 */
function formatDateOffset(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 地点检索通常更偏好完整城市名，这里给常见城市补一个“市”后缀。
function normalizeCityName(cityName: string) {
  if (
    cityName.endsWith("市") ||
    cityName.endsWith("区") ||
    cityName.endsWith("州")
  ) {
    return cityName;
  }
  return `${cityName}市`;
}

// 手动地点联想的“靠近已选景点优先”逻辑入口：
// 1. 先保留百度返回的原始候选集合；
// 2. 再按当前景点池的中心点做近距离排序；
// 3. 最终只改变候选展示顺序，不改用户原始检索词。
function buildManualLocationOptions(
  candidates: PoiCalibrationCandidateDto[] | undefined,
  referencePoint?: GeoPoint,
) {
  return sortPoiCandidatesByDistance(candidates ?? [], referencePoint).map(
    (candidate) => {
      const position = candidate.naviLocation ?? candidate.location;
      return {
        value: candidate.name,
        location: {
          name: candidate.name,
          position: position!,
          address: candidate.address,
        } satisfies RouteLocation,
        label: (
          <div className={styles.startPointOption}>
            <strong>{candidate.name}</strong>
            <span>
              {candidate.address || `${candidate.city}${candidate.area}`}
            </span>
          </div>
        ),
      };
    },
  );
}

function pickBestPoiCandidate(
  candidates: PoiCalibrationCandidateDto[],
  referencePoint?: GeoPoint,
) {
  return sortPoiCandidatesByDistance(candidates, referencePoint)[0];
}

// 这里是真正的“优先靠近已选景点”排序逻辑：
// - referencePoint 来自当前已选景点的几何中心点；
// - 如果没有景点池或没有可用中心点，则保持百度原始返回顺序；
// - 如果有中心点，则按候选点到中心点的距离从近到远排序。
function sortPoiCandidatesByDistance(
  candidates: PoiCalibrationCandidateDto[],
  referencePoint?: GeoPoint,
) {
  const validCandidates = candidates.filter(
    (candidate) => candidate.naviLocation ?? candidate.location,
  );
  if (!referencePoint) {
    return validCandidates;
  }

  return [...validCandidates].sort((left, right) => {
    const leftPosition = left.naviLocation ?? left.location;
    const rightPosition = right.naviLocation ?? right.location;
    return (
      calculateGeoDistance(referencePoint, leftPosition!) -
      calculateGeoDistance(referencePoint, rightPosition!)
    );
  });
}

// 已选景点越分散，越需要一个中心参考点来给联想结果做近距离优先排序。
// 当前实现是把所有已选景点坐标做平均，得到一个简化的“行程重心”。
function resolveTripCenterPoint(
  tripSpots: TravelSpot[],
  fallbackPoint?: GeoPoint,
) {
  if (!tripSpots.length) {
    return fallbackPoint;
  }

  const totals = tripSpots.reduce(
    (result, spot) => ({
      lng: result.lng + spot.position.lng,
      lat: result.lat + spot.position.lat,
    }),
    { lng: 0, lat: 0 },
  );

  return {
    lng: totals.lng / tripSpots.length,
    lat: totals.lat / tripSpots.length,
  } satisfies GeoPoint;
}

function calculateGeoDistance(left: GeoPoint, right: GeoPoint) {
  const lngDelta = left.lng - right.lng;
  const latDelta = left.lat - right.lat;
  return lngDelta * lngDelta + latDelta * latDelta;
}

function findKnownCityByLocation(
  location: LocatedCityInfo,
  cities: TravelCity[],
) {
  const locatedCityName = normalizeLocationCityName(location.city);
  const locatedProvinceName = normalizeLocationCityName(location.province);
  return cities.find((city) => {
    const cityName = normalizeLocationCityName(city.name);
    const provinceName = normalizeLocationCityName(city.provinceName);
    return (
      cityName === locatedCityName ||
      (cityName && location.city.includes(cityName)) ||
      (locatedCityName && cityName.includes(locatedCityName)) ||
      (cityName === locatedProvinceName && provinceName === locatedProvinceName)
    );
  });
}

interface LocatedCityInfo {
  province: string;
  city: string;
}

function reverseGeocodeCityByPosition(
  position: GeoPoint,
): Promise<LocatedCityInfo | undefined> {
  return loadBaiduMapGL().then(
    () =>
      new Promise((resolve) => {
        const geocoder = new window.BMapGL!.Geocoder();
        geocoder.getLocation(createBaiduPoint(position), (result) => {
          const components = result?.addressComponents;
          resolve(
            components
              ? {
                  province: components.province ?? "",
                  city: components.city ?? components.province ?? "",
                }
              : undefined,
          );
        });
      }),
  );
}

function normalizeLocationCityName(value?: string) {
  return (value ?? "")
    .trim()
    .replace(
      /(省|市|特别行政区|地区|盟|自治州|藏族自治州|回族自治州|蒙古自治州)$/u,
      "",
    );
}
