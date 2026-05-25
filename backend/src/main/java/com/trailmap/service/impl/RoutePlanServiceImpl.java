package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.config.BaiduMapProperties;
import com.trailmap.entity.City;
import com.trailmap.entity.Spot;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.model.query.CoordinateRequest;
import com.trailmap.model.query.RouteLocationRequest;
import com.trailmap.model.query.RoutePlanRequest;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.ItineraryItemResponse;
import com.trailmap.model.response.ItineraryDayResponse;
import com.trailmap.model.response.PoiCalibrationCandidateResponse;
import com.trailmap.model.response.RoutePlanResponse;
import com.trailmap.model.response.RouteSegmentResponse;
import com.trailmap.model.response.RouteSpotStayPlanResponse;
import com.trailmap.service.PoiCalibrationService;
import com.trailmap.service.RoutePlanService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 行程规划服务实现。
 * 当前先实现自由路线模式：按景点池顺序生成每段路线，并汇总交通时间、停留时间和总行程时间。
 */
@Service
public class RoutePlanServiceImpl implements RoutePlanService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final String PLAN_MODE_SCHEDULE = "schedule";
    private static final String LOCATION_MODE_NONE = "none";
    private static final String LOCATION_MODE_MANUAL = "manual";
    private static final String LOCATION_MODE_RECOMMENDED = "recommended";

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;
    private final BaiduMapProperties baiduMapProperties;
    private final PoiCalibrationService poiCalibrationService;
    private final RestClient restClient;

    public RoutePlanServiceImpl(
            CityMapper cityMapper,
            SpotMapper spotMapper,
            BaiduMapProperties baiduMapProperties,
            PoiCalibrationService poiCalibrationService) {
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
        this.baiduMapProperties = baiduMapProperties;
        this.poiCalibrationService = poiCalibrationService;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public RoutePlanResponse plan(RoutePlanRequest request) {
        // 入口先做基础校验，避免后续第三方调用时才暴露出“城市不存在 / 参数无效”这类问题。
        City city = loadCity(request.cityId());
        validatePlanMode(request.planMode());
        validateTransportType(request.transportType());
        validateLocationMode(request.lunchMode(), "午餐");
        validateLocationMode(request.restMode(), "休息");
        validateLocationMode(request.hotelMode(), "酒店");
        validateRequiredLocation(request.lunchMode(), request.lunchLocation(), "午餐");
        validateRequiredLocation(request.restMode(), request.restLocation(), "休息");
        validateRequiredLocation(request.hotelMode(), request.hotelLocation(), "酒店");

        List<Spot> orderedSpots = loadOrderedSpots(request.cityId(), request.spotIds());
        List<RouteStop> routeStops = buildRouteStops(request.startPoint(), orderedSpots, request.endPoint());
        List<RouteSegmentResponse> segments = buildSegments(routeStops, request.transportType());
        PlanningSnapshot planningSnapshot = buildPlanningSnapshot(request, city, orderedSpots, segments);
        int totalTravelDurationSeconds = segments.stream()
                .map(RouteSegmentResponse::durationSeconds)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        int totalDistanceMeters = segments.stream()
                .map(RouteSegmentResponse::distanceMeters)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        int totalStayDurationMinutes = planningSnapshot.spotStayPlans().stream()
                .map(RouteSpotStayPlanResponse::suggestedDurationMinutes)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        if (PLAN_MODE_SCHEDULE.equals(request.planMode().toLowerCase(Locale.ROOT))) {
            totalTravelDurationSeconds = planningSnapshot.itineraryDays().stream()
                    .map(ItineraryDayResponse::totalTravelDurationSeconds)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
            totalDistanceMeters = planningSnapshot.itineraryDays().stream()
                    .map(ItineraryDayResponse::totalDistanceMeters)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
        }
        int totalTripDurationMinutes = PLAN_MODE_SCHEDULE.equals(request.planMode().toLowerCase(Locale.ROOT))
                ? planningSnapshot.itineraryDays().stream()
                        .map(ItineraryDayResponse::totalTripDurationMinutes)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .sum()
                : totalStayDurationMinutes + Math.ceilDiv(totalTravelDurationSeconds, 60);

        return new RoutePlanResponse(
                null,
                request.cityId(),
                normalizeTransportType(request.transportType()),
                request.planMode().toLowerCase(Locale.ROOT),
                buildRouteSummary(request.startPoint().name(), orderedSpots, totalTravelDurationSeconds,
                        totalStayDurationMinutes),
                orderedSpots.stream().map(Spot::getId).toList(),
                totalDistanceMeters,
                totalTravelDurationSeconds,
                totalStayDurationMinutes,
                totalTripDurationMinutes,
                planningSnapshot.spotStayPlans(),
                segments,
                planningSnapshot.itineraryDays());
    }

    /**
     * 根据规划模式决定是否生成“完整行程模式”的时间编排结果。
     * free 模式只返回建议停留时长；schedule 模式补充 dayIndex 和建议到离时间。
     */
    private PlanningSnapshot buildPlanningSnapshot(RoutePlanRequest request, City city, List<Spot> orderedSpots,
            List<RouteSegmentResponse> segments) {
        if (!PLAN_MODE_SCHEDULE.equals(request.planMode().toLowerCase(Locale.ROOT))) {
            List<RouteSpotStayPlanResponse> freeModeStayPlans = orderedSpots.stream()
                    .map(this::toStayPlan)
                    .toList();
            return new PlanningSnapshot(freeModeStayPlans, List.of());
        }

        return buildScheduledItinerary(request, city, orderedSpots, segments);
    }

    /**
     * 完整行程模式 V1：
     * 先做“多天拆分 + 时间表生成”，不处理酒店推荐、餐厅推荐，只按规则插入午餐占用时间。
     */
    private PlanningSnapshot buildScheduledItinerary(RoutePlanRequest request, City city, List<Spot> orderedSpots,
            List<RouteSegmentResponse> segments) {
        int tripDays = request.tripDays() == null ? 2 : request.tripDays();
        LocalTime dayStartTime = parseTimeOrDefault(request.dailyStartTime(), "09:00");
        LocalTime dayEndTime = parseTimeOrDefault(request.dailyEndTime(), "18:00");
        boolean includeLunchBreak = Boolean.TRUE.equals(request.includeLunchBreak());
        int lunchBreakMinutes = includeLunchBreak ? 60 : 0;
        int dailyBudgetMinutes = Math.max(240,
                dayEndTime.toSecondOfDay() / 60 - dayStartTime.toSecondOfDay() / 60 - lunchBreakMinutes);
        double intensityMultiplier = resolveIntensityMultiplier(request.intensity());

        List<RouteSpotStayPlanResponse> spotStayPlans = new ArrayList<>();
        List<ItineraryDayAccumulator> dayAccumulators = new ArrayList<>();
        int currentDayIndex = 1;
        int currentDayUsedMinutes = 0;
        int currentClockMinutes = dayStartTime.toSecondOfDay() / 60;
        ItineraryDayAccumulator currentDay = new ItineraryDayAccumulator(
                currentDayIndex,
                toRouteStop(request.startPoint()),
                formatClock(dayStartTime.toSecondOfDay() / 60));
        dayAccumulators.add(currentDay);
        boolean lunchInserted = false;
        boolean restInserted = false;

        for (int index = 0; index < orderedSpots.size(); index++) {
            Spot spot = orderedSpots.get(index);
            int segmentMinutes = index < segments.size() ? Math.ceilDiv(segments.get(index).durationSeconds(), 60) : 0;
            int stayMinutes = estimateScheduledStayMinutes(spot, intensityMultiplier);
            int projectedMinutes = currentDayUsedMinutes + segmentMinutes + stayMinutes;

            // 当前天达到按天均分的目标，或时间预算放不下时切到下一天。
            // 这样用户选择 3 天时，景点会主动分摊到多天，而不是只在 Day 1 放不下时才拆分。
            if (shouldStartNextScheduleDay(
                    currentDay,
                    currentDayIndex,
                    tripDays,
                    orderedSpots.size(),
                    index,
                    projectedMinutes,
                    dailyBudgetMinutes)) {
                currentClockMinutes = appendHotelIfNeeded(
                        currentDay,
                        request,
                        city,
                        orderedSpots,
                        currentClockMinutes,
                        currentDay.spots().get(currentDay.spots().size() - 1));
                currentDayIndex++;
                currentDayUsedMinutes = 0;
                currentClockMinutes = dayStartTime.toSecondOfDay() / 60;
                currentDay = new ItineraryDayAccumulator(
                        currentDayIndex,
                        resolveNextDayStartStop(currentDay, request),
                        formatClock(dayStartTime.toSecondOfDay() / 60));
                dayAccumulators.add(currentDay);
                lunchInserted = false;
                restInserted = false;
            }

            currentDayUsedMinutes += segmentMinutes;
            currentClockMinutes += segmentMinutes;
            String suggestedStartTime = formatClock(currentClockMinutes);
            currentClockMinutes += stayMinutes;
            currentDayUsedMinutes += stayMinutes;
            String suggestedEndTime = formatClock(currentClockMinutes);

            RouteSpotStayPlanResponse stayPlan = new RouteSpotStayPlanResponse(
                    spot.getId(),
                    spot.getSpotName(),
                    stayMinutes,
                    suggestedStartTime,
                    suggestedEndTime,
                    currentDayIndex);
            spotStayPlans.add(stayPlan);
            currentDay.spots().add(stayPlan);
            currentDay.items().add(buildSpotItem(currentDay.items().size() + 1, stayPlan, spot));

            if (includeLunchBreak && !lunchInserted && shouldInsertLunch(currentClockMinutes)) {
                currentClockMinutes = appendMealItem(currentDay, request, city, spot, currentClockMinutes);
                currentDayUsedMinutes += lunchBreakMinutes;
                lunchInserted = true;
            }

            if (!restInserted && shouldInsertRest(request, currentClockMinutes)) {
                currentClockMinutes = appendRestItem(currentDay, request, city, spot, currentClockMinutes);
                currentDayUsedMinutes += 30;
                restInserted = true;
            }
        }

        if (!currentDay.spots().isEmpty()) {
            appendHotelIfNeeded(
                    currentDay,
                    request,
                    city,
                    orderedSpots,
                    currentClockMinutes,
                    currentDay.spots().get(currentDay.spots().size() - 1));
        }

        List<ItineraryDayResponse> itineraryDays = dayAccumulators.stream()
                .map(day -> toItineraryDay(day, request.transportType()))
                .toList();
        return new PlanningSnapshot(spotStayPlans, itineraryDays);
    }

    /**
     * 判断完整行程是否需要切换到下一天。
     * 时间预算负责“当天放不下”的情况，景点配额负责“按用户选择天数分摊”的情况。
     */
    private boolean shouldStartNextScheduleDay(
            ItineraryDayAccumulator currentDay,
            int currentDayIndex,
            int tripDays,
            int totalSpotCount,
            int currentSpotIndex,
            int projectedMinutes,
            int dailyBudgetMinutes) {
        if (currentDay.spots().isEmpty() || currentDayIndex >= tripDays) {
            return false;
        }

        int remainingSpotCount = totalSpotCount - currentSpotIndex;
        int remainingDayCount = tripDays - currentDayIndex + 1;
        int targetSpotCountToday = Math.max(1, (int) Math.ceil((double) remainingSpotCount / remainingDayCount));
        boolean reachedBalancedSpotQuota = currentDay.spots().size() >= targetSpotCountToday;
        boolean exceedDailyBudget = projectedMinutes > dailyBudgetMinutes;
        return reachedBalancedSpotQuota || exceedDailyBudget;
    }

    /**
     * 把“起点 + 景点池 + 可选终点”整理成一条完整停靠链。
     * 当前自由路线模式按用户传入的景点顺序生成，不做智能重排。
     */
    private List<RouteStop> buildRouteStops(RouteLocationRequest startPoint, List<Spot> orderedSpots,
            RouteLocationRequest endPoint) {
        List<RouteStop> stops = new ArrayList<>();
        stops.add(new RouteStop(null, startPoint.name(), toCoordinate(startPoint.position()), 0));
        orderedSpots.forEach(spot -> stops.add(new RouteStop(
                spot.getId(),
                spot.getSpotName(),
                new CoordinateResponse(spot.getLng(), spot.getLat()),
                spot.getSuggestedDuration() == null ? 90 : spot.getSuggestedDuration())));
        if (endPoint != null) {
            stops.add(new RouteStop(null, endPoint.name(), toCoordinate(endPoint.position()), 0));
        }
        return stops;
    }

    /**
     * 依次为相邻两个停靠点生成路线分段。
     * 这样前端既可以展示“总路线”，也可以逐段展示换乘和行进说明。
     */
    private List<RouteSegmentResponse> buildSegments(List<RouteStop> stops, String transportType) {
        List<RouteSegmentResponse> segments = new ArrayList<>();
        for (int index = 0; index < stops.size() - 1; index++) {
            RouteStop fromStop = stops.get(index);
            RouteStop toStop = stops.get(index + 1);
            segments.add(buildSingleSegment(index + 1, fromStop, toStop, transportType));
        }
        return segments;
    }

    /**
     * 优先走百度真实路线规划；如果当前环境没配 AK 或第三方失败，则退回本地估算结果。
     * 这样测试环境和未配置外部能力的开发环境也能保持主流程可用。
     */
    private RouteSegmentResponse buildSingleSegment(int segmentIndex, RouteStop fromStop, RouteStop toStop,
            String transportType) {
        String normalizedTransportType = normalizeTransportType(transportType);
        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            return buildEstimatedSegment(segmentIndex, fromStop, toStop, normalizedTransportType,
                    "未配置百度路线规划 AK，当前返回估算路线");
        }

        try {
            String responseText = requestRoute(fromStop.position(), toStop.position(), normalizedTransportType);
            return parseSegment(segmentIndex, fromStop, toStop, normalizedTransportType, responseText);
        } catch (Exception exception) {
            // 地图服务失败时先回退到估算结果，保证 MVP 行程规划主流程不中断。
            return buildEstimatedSegment(segmentIndex, fromStop, toStop, normalizedTransportType,
                    "百度路线规划调用失败，当前返回估算路线");
        }
    }

    /**
     * 调百度轻量级路线规划接口。
     * 当前统一传 GCJ-02 坐标，保持和数据库内部坐标体系一致。
     */
    private String requestRoute(CoordinateResponse origin, CoordinateResponse destination, String transportType) {
        String responseText = restClient.get()
                .uri(UriComponentsBuilder.fromHttpUrl(resolveRouteUrl(transportType))
                        .queryParam("origin", formatPointForBaidu(origin))
                        .queryParam("destination", formatPointForBaidu(destination))
                        .queryParam("coord_type", "gcj02")
                        .queryParam("ret_coordtype", "gcj02")
                        .queryParam("output", "json")
                        .queryParam("ak", baiduMapProperties.getServerAk())
                        .build(true)
                        .toUri())
                .retrieve()
                .body(String.class);
        if (!StringUtils.hasText(responseText)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "百度路线规划返回为空");
        }
        return responseText;
    }

    /**
     * 解析百度路线规划响应，抽取当前阶段前端真正会消费的字段。
     * 完整原始响应未来如果要落库，可再补 raw_response 持久化。
     */
    private RouteSegmentResponse parseSegment(int segmentIndex, RouteStop fromStop, RouteStop toStop,
            String transportType, String responseText) {
        try {
            JsonNode root = OBJECT_MAPPER.readTree(responseText);
            if (root.path("status").asInt() != 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "百度路线规划失败: " + root.path("message").asText("unknown error"));
            }

            JsonNode routeNode = root.path("result").path("routes").get(0);
            if (routeNode == null || routeNode.isMissingNode()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "百度路线规划未返回可用路线");
            }

            List<String> stepTexts = extractStepTexts(routeNode.path("steps"), transportType);
            List<CoordinateResponse> polyline = extractPolyline(routeNode.path("steps"), transportType);
            return new RouteSegmentResponse(
                    segmentIndex,
                    fromStop.name(),
                    fromStop.position(),
                    toStop.name(),
                    toStop.position(),
                    transportType,
                    routeNode.path("distance").asInt(),
                    routeNode.path("duration").asInt(),
                    stepTexts.isEmpty() ? "已生成路线" : stepTexts.get(0),
                    polyline,
                    stepTexts);
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "解析百度路线规划结果失败");
        }
    }

    /**
     * 公交返回的 steps 是二维数组，其他交通方式是一维数组，这里做统一抹平。
     */
    private List<String> extractStepTexts(JsonNode stepsNode, String transportType) {
        if ("transit".equals(transportType)) {
            return StreamSupport.stream(stepsNode.spliterator(), false)
                    .filter(JsonNode::isArray)
                    .flatMap(stepGroup -> StreamSupport.stream(stepGroup.spliterator(), false))
                    .map(step -> sanitizeInstruction(step.path("instruction").asText()))
                    .filter(StringUtils::hasText)
                    .toList();
        }

        return StreamSupport.stream(stepsNode.spliterator(), false)
                .map(step -> sanitizeInstruction(step.path("instruction").asText()))
                .filter(StringUtils::hasText)
                .toList();
    }

    /**
     * 把分步路径拼成一条连续 polyline，供前端地图直接渲染路线线条。
     */
    private List<CoordinateResponse> extractPolyline(JsonNode stepsNode, String transportType) {
        Map<String, CoordinateResponse> orderedPoints = new LinkedHashMap<>();
        if ("transit".equals(transportType)) {
            StreamSupport.stream(stepsNode.spliterator(), false)
                    .filter(JsonNode::isArray)
                    .flatMap(stepGroup -> StreamSupport.stream(stepGroup.spliterator(), false))
                    .forEach(step -> appendPathCoordinates(orderedPoints, step.path("path").asText()));
        } else {
            StreamSupport.stream(stepsNode.spliterator(), false)
                    .forEach(step -> appendPathCoordinates(orderedPoints, step.path("path").asText()));
        }
        return List.copyOf(orderedPoints.values());
    }

    /**
     * 路径字符串是“lng,lat;lng,lat...”格式，这里顺序去重后转成坐标对象。
     */
    private void appendPathCoordinates(Map<String, CoordinateResponse> orderedPoints, String pathText) {
        if (!StringUtils.hasText(pathText)) {
            return;
        }
        for (String pointText : pathText.split(";")) {
            String[] values = pointText.split(",");
            if (values.length != 2) {
                continue;
            }
            CoordinateResponse point = new CoordinateResponse(new BigDecimal(values[0]), new BigDecimal(values[1]));
            orderedPoints.putIfAbsent(pointText, point);
        }
    }

    /**
     * 估算路线只作为兜底，不追求逐步导航精度，只保证距离、耗时和线段可展示。
     */
    private RouteSegmentResponse buildEstimatedSegment(int segmentIndex, RouteStop fromStop, RouteStop toStop,
            String transportType, String reason) {
        int distanceMeters = estimateDistanceMeters(fromStop.position(), toStop.position());
        int durationSeconds = estimateDurationSeconds(distanceMeters, transportType);
        String instruction = reason + "：" + fromStop.name() + " 前往 " + toStop.name();
        return new RouteSegmentResponse(
                segmentIndex,
                fromStop.name(),
                fromStop.position(),
                toStop.name(),
                toStop.position(),
                transportType,
                distanceMeters,
                durationSeconds,
                instruction,
                List.of(fromStop.position(), toStop.position()),
                List.of(instruction));
    }

    /**
     * 景点停留计划当前先直接复用景点建议游玩时长。
     * 完整行程模式再在这里补充具体开始/结束时间和 Day 拆分。
     */
    private RouteSpotStayPlanResponse toStayPlan(Spot spot) {
        return new RouteSpotStayPlanResponse(
                spot.getId(),
                spot.getSpotName(),
                spot.getSuggestedDuration() == null ? 90 : spot.getSuggestedDuration(),
                null,
                null,
                null);
    }

    /**
     * 将按天累积的时间轴结果转换成返回前端的日程对象。
     * 完整行程按“当天相邻真实节点”重算路线，这样吃饭、休息、酒店节点也有自己的真实路径。
     */
    private ItineraryDayResponse toItineraryDay(ItineraryDayAccumulator day, String transportType) {
        List<RouteSegmentResponse> daySegments = buildDaySegments(day.startStop(), day.items(), transportType);
        int totalDistanceMeters = daySegments.stream()
                .map(RouteSegmentResponse::distanceMeters)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        int totalTravelDurationSeconds = daySegments.stream()
                .map(RouteSegmentResponse::durationSeconds)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        int totalStayDurationMinutes = day.spots().stream()
                .map(RouteSpotStayPlanResponse::suggestedDurationMinutes)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        int extraItemDurationMinutes = day.items().stream()
                .filter(item -> !"spot".equals(item.itemType()))
                .map(ItineraryItemResponse::durationMinutes)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        return new ItineraryDayResponse(
                day.dayIndex(),
                "Day " + day.dayIndex(),
                day.startTime(),
                day.startStop().name(),
                totalDistanceMeters,
                totalTravelDurationSeconds,
                totalStayDurationMinutes,
                totalStayDurationMinutes + extraItemDurationMinutes + Math.ceilDiv(totalTravelDurationSeconds, 60),
                List.copyOf(day.spots()),
                List.copyOf(day.items()),
                List.copyOf(daySegments));
    }

    private List<RouteSegmentResponse> buildDaySegments(RouteStop dayStartStop, List<ItineraryItemResponse> items,
            String transportType) {
        List<RouteSegmentResponse> daySegments = new ArrayList<>();
        List<ItineraryItemResponse> positionedItems = items.stream()
                .filter(item -> item.position() != null)
                .toList();
        RouteStop previousStop = dayStartStop;
        int segmentIndex = 1;
        for (ItineraryItemResponse positionedItem : positionedItems) {
            RouteStop nextStop = new RouteStop(
                    positionedItem.relatedSpotId(),
                    positionedItem.placeName(),
                    positionedItem.position(),
                    positionedItem.durationMinutes());
            daySegments.add(buildSingleSegment(segmentIndex, previousStop, nextStop, transportType));
            previousStop = nextStop;
            segmentIndex += 1;
        }
        return daySegments;
    }

    private RouteStop resolveNextDayStartStop(ItineraryDayAccumulator currentDay, RoutePlanRequest request) {
        for (int index = currentDay.items().size() - 1; index >= 0; index--) {
            ItineraryItemResponse item = currentDay.items().get(index);
            if ("hotel".equals(item.itemType()) && item.position() != null) {
                return new RouteStop(null, item.placeName(), item.position(), 0);
            }
        }
        return toRouteStop(request.startPoint());
    }

    private RouteStop toRouteStop(RouteLocationRequest locationRequest) {
        return new RouteStop(null, locationRequest.name(), toCoordinate(locationRequest.position()), 0);
    }

    /**
     * 景点节点作为完整行程时间轴的基础项，保留景点信息和到离时间。
     */
    private ItineraryItemResponse buildSpotItem(Integer sequence, RouteSpotStayPlanResponse stayPlan, Spot spot) {
        return new ItineraryItemResponse(
                sequence,
                "spot",
                stayPlan.spotName(),
                stayPlan.spotName(),
                spot.getSpotType(),
                new CoordinateResponse(spot.getLng(), spot.getLat()),
                stayPlan.suggestedDurationMinutes(),
                stayPlan.suggestedStartTime(),
                stayPlan.suggestedEndTime(),
                stayPlan.spotId(),
                "核心游玩节点");
    }

    private boolean shouldInsertLunch(int currentClockMinutes) {
        return currentClockMinutes >= 11 * 60 + 30 && currentClockMinutes <= 13 * 60 + 30;
    }

    private boolean shouldInsertRest(RoutePlanRequest request, int currentClockMinutes) {
        return !LOCATION_MODE_NONE.equals(normalizeLocationMode(request.restMode())) && currentClockMinutes >= 15 * 60;
    }

    private int appendMealItem(ItineraryDayAccumulator day, RoutePlanRequest request, City city, Spot anchorSpot,
            int currentClockMinutes) {
        int mealDurationMinutes = 60;
        int startMinutes = Math.max(currentClockMinutes, 12 * 60);
        int endMinutes = startMinutes + mealDurationMinutes;
        ItineraryItemResponse mealItem = buildSupportItem(
                day.items().size() + 1,
                "lunch",
                "午餐",
                "dining",
                startMinutes,
                endMinutes,
                request.lunchMode(),
                request.lunchLocation(),
                city,
                anchorSpot,
                "商场 美食 餐厅",
                1200,
                "中午用餐节点");
        day.items().add(mealItem);
        return endMinutes;
    }

    private int appendRestItem(ItineraryDayAccumulator day, RoutePlanRequest request, City city, Spot anchorSpot,
            int currentClockMinutes) {
        int restDurationMinutes = 30;
        int startMinutes = Math.max(currentClockMinutes, 15 * 60);
        int endMinutes = startMinutes + restDurationMinutes;
        ItineraryItemResponse restItem = buildSupportItem(
                day.items().size() + 1,
                "rest",
                "休息",
                "rest",
                startMinutes,
                endMinutes,
                request.restMode(),
                request.restLocation(),
                city,
                anchorSpot,
                "商场 咖啡馆 游客中心",
                1500,
                "下午休息节点");
        day.items().add(restItem);
        return endMinutes;
    }

    private int appendHotelIfNeeded(
            ItineraryDayAccumulator day,
            RoutePlanRequest request,
            City city,
            List<Spot> orderedSpots,
            int currentClockMinutes,
            RouteSpotStayPlanResponse anchorStayPlan) {
        if (!Boolean.TRUE.equals(request.returnToHotel())
                || LOCATION_MODE_NONE.equals(normalizeLocationMode(request.hotelMode()))) {
            return currentClockMinutes;
        }

        Spot anchorSpot = orderedSpots.stream()
                .filter(spot -> Objects.equals(spot.getId(), anchorStayPlan.spotId()))
                .findFirst()
                .orElse(null);
        if (anchorSpot == null) {
            return currentClockMinutes;
        }

        int stayDurationMinutes = 20;
        int endMinutes = currentClockMinutes + stayDurationMinutes;
        day.items().add(buildSupportItem(
                day.items().size() + 1,
                "hotel",
                "返回酒店",
                "hotel",
                currentClockMinutes,
                endMinutes,
                request.hotelMode(),
                request.hotelLocation(),
                city,
                anchorSpot,
                "酒店 住宿",
                3000,
                "当天收尾节点"));
        return endMinutes;
    }

    /**
     * 午餐、休息、酒店这类节点优先使用用户手动地点；未指定时，再按景点附近做实时推荐。
     */
    private ItineraryItemResponse buildSupportItem(
            Integer sequence,
            String itemType,
            String title,
            String placeType,
            int startMinutes,
            int endMinutes,
            String mode,
            RouteLocationRequest manualLocation,
            City city,
            Spot anchorSpot,
            String recommendKeyword,
            int radiusMeters,
            String fallbackNote) {
        String normalizedMode = normalizeLocationMode(mode);
        if (LOCATION_MODE_MANUAL.equals(normalizedMode) && manualLocation != null) {
            return new ItineraryItemResponse(
                    sequence,
                    itemType,
                    title,
                    manualLocation.name(),
                    placeType,
                    toCoordinate(manualLocation.position()),
                    endMinutes - startMinutes,
                    formatClock(startMinutes),
                    formatClock(endMinutes),
                    anchorSpot.getId(),
                    "用户手动选择地点");
        }

        if (LOCATION_MODE_RECOMMENDED.equals(normalizedMode)) {
            PoiCalibrationCandidateResponse candidate = recommendNearbyPoi(city.getCityName(), anchorSpot,
                    recommendKeyword, radiusMeters);
            if (candidate != null) {
                CoordinateResponse position = candidate.naviLocation() != null ? candidate.naviLocation()
                        : candidate.location();
                return new ItineraryItemResponse(
                        sequence,
                        itemType,
                        title,
                        candidate.name(),
                        placeType,
                        position,
                        endMinutes - startMinutes,
                        formatClock(startMinutes),
                        formatClock(endMinutes),
                        anchorSpot.getId(),
                        "系统按附近景点实时推荐");
            }
        }

        // 系统推荐失败时保留时间块，但把失败原因写入 note，方便前端和调试时判断是配置问题还是召回问题。
        String resolvedFallbackNote = resolveSupportItemFallbackNote(normalizedMode, fallbackNote);
        return new ItineraryItemResponse(
                sequence,
                itemType,
                title,
                title,
                placeType,
                null,
                endMinutes - startMinutes,
                formatClock(startMinutes),
                formatClock(endMinutes),
                anchorSpot.getId(),
                resolvedFallbackNote);
    }

    private PoiCalibrationCandidateResponse recommendNearbyPoi(String cityName, Spot anchorSpot, String keyword,
            int radiusMeters) {
        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            return null;
        }

        try {
            List<PoiCalibrationCandidateResponse> candidates = poiCalibrationService.searchNearbyCandidates(
                    cityName,
                    new CoordinateResponse(anchorSpot.getLng(), anchorSpot.getLat()),
                    keyword,
                    radiusMeters);
            return candidates.isEmpty() ? null : candidates.get(0);
        } catch (Exception exception) {
            return null;
        }
    }

    /**
     * 补充节点没有真实地点时仍要区分原因，避免“系统推荐已开启但只看到午餐占位”时难以排查。
     */
    private String resolveSupportItemFallbackNote(String normalizedMode, String fallbackNote) {
        if (!LOCATION_MODE_RECOMMENDED.equals(normalizedMode)) {
            return fallbackNote;
        }

        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            return "未配置百度地图服务端 AK，暂以时间块占位";
        }

        return "啊偶，没有找到吃的，手动找找看";
    }

    /**
     * 先生成一段可读摘要，方便前端底部行程池和后续 route_record 总览直接复用。
     */
    private String buildRouteSummary(String startName, List<Spot> orderedSpots, int totalTravelDurationSeconds,
            int totalStayDurationMinutes) {
        String spotSummary = orderedSpots.stream().map(Spot::getSpotName).collect(Collectors.joining(" → "));
        return String.format(
                Locale.ROOT,
                "从%s出发，串联%d个景点：%s。预计交通%d分钟，建议游玩%d分钟。",
                startName,
                orderedSpots.size(),
                spotSummary,
                Math.ceilDiv(totalTravelDurationSeconds, 60),
                totalStayDurationMinutes);
    }

    private LocalTime parseTimeOrDefault(String timeText, String defaultValue) {
        return LocalTime.parse(StringUtils.hasText(timeText) ? timeText : defaultValue, TIME_FORMATTER);
    }

    private double resolveIntensityMultiplier(String intensity) {
        if (!StringUtils.hasText(intensity)) {
            return 1.0D;
        }
        return switch (intensity.toLowerCase(Locale.ROOT)) {
            case "relaxed" -> 0.9D;
            case "compact" -> 1.1D;
            default -> 1.0D;
        };
    }

    private int estimateScheduledStayMinutes(Spot spot, double intensityMultiplier) {
        int baseMinutes = spot.getSuggestedDuration() == null ? 90 : spot.getSuggestedDuration();
        return Math.max(30, (int) Math.round(baseMinutes * intensityMultiplier));
    }

    private String formatClock(int totalMinutes) {
        int normalizedMinutes = Math.max(0, totalMinutes);
        int hours = normalizedMinutes / 60;
        int minutes = normalizedMinutes % 60;
        return String.format(Locale.ROOT, "%02d:%02d", hours, minutes);
    }

    /**
     * 按请求顺序回填景点实体，并校验是否存在跨城市或无效景点。
     */
    private List<Spot> loadOrderedSpots(Long cityId, List<Long> requestedSpotIds) {
        List<Long> distinctSpotIds = requestedSpotIds.stream().distinct().toList();
        List<Spot> spots = spotMapper.selectList(new LambdaQueryWrapper<Spot>()
                .eq(Spot::getCityId, cityId)
                .eq(Spot::getStatus, 1)
                .in(Spot::getId, distinctSpotIds));
        if (spots.size() != distinctSpotIds.size()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "景点池中包含无效景点或跨城市景点");
        }

        Map<Long, Spot> spotMapping = spots.stream().collect(Collectors.toMap(Spot::getId, spot -> spot));
        return distinctSpotIds.stream().map(spotMapping::get).toList();
    }

    private City loadCity(Long cityId) {
        City city = cityMapper.selectOne(new LambdaQueryWrapper<City>()
                .eq(City::getId, cityId)
                .eq(City::getStatus, 1)
                .last("limit 1"));
        if (city == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "城市不存在或已下线");
        }
        return city;
    }

    private void validatePlanMode(String planMode) {
        if (!StringUtils.hasText(planMode)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "规划模式不能为空");
        }
        String normalizedPlanMode = planMode.toLowerCase(Locale.ROOT);
        if (!List.of("free", "schedule").contains(normalizedPlanMode)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的规划模式: " + planMode);
        }
    }

    private void validateTransportType(String transportType) {
        String normalizedTransportType = normalizeTransportType(transportType);
        if (!List.of("transit", "driving", "walking", "bicycling").contains(normalizedTransportType)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的交通方式: " + transportType);
        }
    }

    private void validateLocationMode(String locationMode, String label) {
        String normalizedMode = normalizeLocationMode(locationMode);
        if (!List.of(LOCATION_MODE_NONE, LOCATION_MODE_MANUAL, LOCATION_MODE_RECOMMENDED).contains(normalizedMode)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, label + "地点模式不支持: " + locationMode);
        }
    }

    private void validateRequiredLocation(String locationMode, RouteLocationRequest location, String label) {
        if (LOCATION_MODE_MANUAL.equals(normalizeLocationMode(locationMode)) && location == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, label + "地点为手动选择时必须传入具体地点");
        }
    }

    private String normalizeLocationMode(String locationMode) {
        return StringUtils.hasText(locationMode) ? locationMode.toLowerCase(Locale.ROOT) : LOCATION_MODE_NONE;
    }

    private String normalizeTransportType(String transportType) {
        return transportType.toLowerCase(Locale.ROOT);
    }

    private CoordinateResponse toCoordinate(CoordinateRequest position) {
        return new CoordinateResponse(position.lng(), position.lat());
    }

    private String resolveRouteUrl(String transportType) {
        return switch (transportType) {
            case "walking" -> baiduMapProperties.getRouteWalkingUrl();
            case "bicycling" -> baiduMapProperties.getRouteRidingUrl();
            case "transit" -> baiduMapProperties.getRouteTransitUrl();
            default -> baiduMapProperties.getRouteDrivingUrl();
        };
    }

    private String formatPointForBaidu(CoordinateResponse point) {
        // 百度路线接口要求传入“纬度,经度”，而业务和数据库内部统一使用“经度,纬度”。
        return point.lat().setScale(6, RoundingMode.HALF_UP) + "," + point.lng().setScale(6, RoundingMode.HALF_UP);
    }

    private String sanitizeInstruction(String instruction) {
        if (!StringUtils.hasText(instruction)) {
            return "";
        }
        return instruction.replaceAll("<[^>]+>", "").trim();
    }

    /**
     * 估算距离使用大圆距离，精度不如真实道路，但足够作为失败兜底结果。
     */
    private int estimateDistanceMeters(CoordinateResponse origin, CoordinateResponse destination) {
        double earthRadius = 6371000D;
        double lat1 = Math.toRadians(origin.lat().doubleValue());
        double lat2 = Math.toRadians(destination.lat().doubleValue());
        double deltaLat = lat2 - lat1;
        double deltaLng = Math.toRadians(destination.lng().doubleValue() - origin.lng().doubleValue());
        double sinLat = Math.sin(deltaLat / 2);
        double sinLng = Math.sin(deltaLng / 2);
        double a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (int) Math.round(earthRadius * c);
    }

    /**
     * 不同交通方式用一组保守速度估算耗时，避免兜底结果过于夸张。
     */
    private int estimateDurationSeconds(int distanceMeters, String transportType) {
        double speedMetersPerSecond = switch (transportType) {
            case "walking" -> 1.3D;
            case "bicycling" -> 3.5D;
            case "transit" -> 5.0D;
            default -> 8.3D;
        };
        return Math.max(60, (int) Math.round(distanceMeters / speedMetersPerSecond));
    }

    private record RouteStop(Long spotId, String name, CoordinateResponse position, Integer suggestedDurationMinutes) {
    }

    private record PlanningSnapshot(List<RouteSpotStayPlanResponse> spotStayPlans,
            List<ItineraryDayResponse> itineraryDays) {
    }

    private record ItineraryDayAccumulator(
            Integer dayIndex,
            RouteStop startStop,
            String startTime,
            List<RouteSpotStayPlanResponse> spots,
            List<ItineraryItemResponse> items) {
        private ItineraryDayAccumulator(Integer dayIndex, RouteStop startStop, String startTime) {
            this(dayIndex, startStop, startTime, new ArrayList<>(), new ArrayList<>());
        }
    }
}
