package com.trailmap.model.response;

import java.util.List;

/**
 * 每日行程响应对象。
 * 完整行程模式用它表达 Day 1 / Day 2，自由路线模式当前可返回空集合。
 */
public record ItineraryDayResponse(
        Integer dayIndex,
        String title,
        Integer totalDistanceMeters,
        Integer totalTravelDurationSeconds,
        Integer totalStayDurationMinutes,
        Integer totalTripDurationMinutes,
        List<RouteSpotStayPlanResponse> spots,
        List<ItineraryItemResponse> items
) {
}
