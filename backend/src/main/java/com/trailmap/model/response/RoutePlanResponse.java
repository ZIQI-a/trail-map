package com.trailmap.model.response;

import java.util.List;

/**
 * 行程规划响应对象。
 * 它不是单纯的路线结果，而是“景点顺序 + 路线分段 + 停留时间 + 总时间”的统一视图。
 */
public record RoutePlanResponse(
        Long routeRecordId,
        Long cityId,
        String transportType,
        String planMode,
        String routeSummary,
        List<Long> orderedSpotIds,
        Integer totalDistanceMeters,
        Integer totalTravelDurationSeconds,
        Integer totalStayDurationMinutes,
        Integer totalTripDurationMinutes,
        List<RouteSpotStayPlanResponse> spotStayPlans,
        List<RouteSegmentResponse> segments,
        List<ItineraryDayResponse> itineraryDays
) {
}
