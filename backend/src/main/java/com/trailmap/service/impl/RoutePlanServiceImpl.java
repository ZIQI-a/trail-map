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
import com.trailmap.model.response.ItineraryDayResponse;
import com.trailmap.model.response.RoutePlanResponse;
import com.trailmap.model.response.RouteSegmentResponse;
import com.trailmap.model.response.RouteSpotStayPlanResponse;
import com.trailmap.service.RoutePlanService;
import java.math.BigDecimal;
import java.math.RoundingMode;
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

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;
    private final BaiduMapProperties baiduMapProperties;
    private final RestClient restClient;

    public RoutePlanServiceImpl(CityMapper cityMapper, SpotMapper spotMapper, BaiduMapProperties baiduMapProperties) {
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
        this.baiduMapProperties = baiduMapProperties;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public RoutePlanResponse plan(RoutePlanRequest request) {
        validateCity(request.cityId());
        validatePlanMode(request.planMode());
        validateTransportType(request.transportType());

        List<Spot> orderedSpots = loadOrderedSpots(request.cityId(), request.spotIds());
        List<RouteSpotStayPlanResponse> spotStayPlans = orderedSpots.stream()
                .map(this::toStayPlan)
                .toList();

        List<RouteStop> routeStops = buildRouteStops(request.startPoint(), orderedSpots, request.endPoint());
        List<RouteSegmentResponse> segments = buildSegments(routeStops, request.transportType());
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
        int totalStayDurationMinutes = spotStayPlans.stream()
                .map(RouteSpotStayPlanResponse::suggestedDurationMinutes)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        int totalTripDurationMinutes = totalStayDurationMinutes + Math.ceilDiv(totalTravelDurationSeconds, 60);

        return new RoutePlanResponse(
                null,
                request.cityId(),
                normalizeTransportType(request.transportType()),
                request.planMode().toLowerCase(Locale.ROOT),
                buildRouteSummary(request.startPoint().name(), orderedSpots, totalTravelDurationSeconds, totalStayDurationMinutes),
                orderedSpots.stream().map(Spot::getId).toList(),
                totalDistanceMeters,
                totalTravelDurationSeconds,
                totalStayDurationMinutes,
                totalTripDurationMinutes,
                spotStayPlans,
                segments,
                List.of()
        );
    }

    private List<RouteStop> buildRouteStops(RouteLocationRequest startPoint, List<Spot> orderedSpots, RouteLocationRequest endPoint) {
        List<RouteStop> stops = new ArrayList<>();
        stops.add(new RouteStop(null, startPoint.name(), toCoordinate(startPoint.position()), 0));
        orderedSpots.forEach(spot -> stops.add(new RouteStop(
                spot.getId(),
                spot.getSpotName(),
                new CoordinateResponse(spot.getLng(), spot.getLat()),
                spot.getSuggestedDuration() == null ? 90 : spot.getSuggestedDuration()
        )));
        if (endPoint != null) {
            stops.add(new RouteStop(null, endPoint.name(), toCoordinate(endPoint.position()), 0));
        }
        return stops;
    }

    private List<RouteSegmentResponse> buildSegments(List<RouteStop> stops, String transportType) {
        List<RouteSegmentResponse> segments = new ArrayList<>();
        for (int index = 0; index < stops.size() - 1; index++) {
            RouteStop fromStop = stops.get(index);
            RouteStop toStop = stops.get(index + 1);
            segments.add(buildSingleSegment(index + 1, fromStop, toStop, transportType));
        }
        return segments;
    }

    private RouteSegmentResponse buildSingleSegment(int segmentIndex, RouteStop fromStop, RouteStop toStop, String transportType) {
        String normalizedTransportType = normalizeTransportType(transportType);
        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            return buildEstimatedSegment(segmentIndex, fromStop, toStop, normalizedTransportType, "未配置百度路线规划 AK，当前返回估算路线");
        }

        try {
            String responseText = requestRoute(fromStop.position(), toStop.position(), normalizedTransportType);
            return parseSegment(segmentIndex, fromStop, toStop, normalizedTransportType, responseText);
        } catch (Exception exception) {
            // 地图服务失败时先回退到估算结果，保证 MVP 行程规划主流程不中断。
            return buildEstimatedSegment(segmentIndex, fromStop, toStop, normalizedTransportType, "百度路线规划调用失败，当前返回估算路线");
        }
    }

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

    private RouteSegmentResponse parseSegment(int segmentIndex, RouteStop fromStop, RouteStop toStop, String transportType, String responseText) {
        try {
            JsonNode root = OBJECT_MAPPER.readTree(responseText);
            if (root.path("status").asInt() != 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "百度路线规划失败: " + root.path("message").asText("unknown error"));
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
                    stepTexts
            );
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "解析百度路线规划结果失败");
        }
    }

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

    private RouteSegmentResponse buildEstimatedSegment(int segmentIndex, RouteStop fromStop, RouteStop toStop, String transportType, String reason) {
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
                List.of(instruction)
        );
    }

    private RouteSpotStayPlanResponse toStayPlan(Spot spot) {
        return new RouteSpotStayPlanResponse(
                spot.getId(),
                spot.getSpotName(),
                spot.getSuggestedDuration() == null ? 90 : spot.getSuggestedDuration(),
                null,
                null,
                null
        );
    }

    private String buildRouteSummary(String startName, List<Spot> orderedSpots, int totalTravelDurationSeconds, int totalStayDurationMinutes) {
        String spotSummary = orderedSpots.stream().map(Spot::getSpotName).collect(Collectors.joining(" → "));
        return String.format(
                Locale.ROOT,
                "从%s出发，串联%d个景点：%s。预计交通%d分钟，建议游玩%d分钟。",
                startName,
                orderedSpots.size(),
                spotSummary,
                Math.ceilDiv(totalTravelDurationSeconds, 60),
                totalStayDurationMinutes
        );
    }

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

    private void validateCity(Long cityId) {
        Long count = cityMapper.selectCount(new LambdaQueryWrapper<City>()
                .eq(City::getId, cityId)
                .eq(City::getStatus, 1));
        if (count == null || count == 0L) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "城市不存在或已下线");
        }
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

    private String normalizeTransportType(String transportType) {
        String normalizedTransportType = transportType.toLowerCase(Locale.ROOT);
        return "taxi".equals(normalizedTransportType) ? "driving" : normalizedTransportType;
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
}
