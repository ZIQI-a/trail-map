package com.trailmap.model.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 行程详情响应。
 */
public record TripDetailResponse(
    Long id,
    Long cityId,
    String cityName,
    String tripName,
    String startName,
    String endName,
    LocalDate startDate,
    LocalDate endDate,
    Integer days,
    String transportType,
    String planMode,
    Integer totalDistance,
    Integer totalDuration,
    Long routeRecordId,
    String coverUrl,
    LocalDateTime createdAt,
    List<TripDaySpotsResponse> itineraryDays
) {
    /**
     * 每日景点列表。
     */
    public record TripDaySpotsResponse(
        Integer dayIndex,
        List<TripSpotDetailResponse> spots,
        List<TripItemDetailResponse> items
    ) {
    }

    /**
     * 行程中的景点明细。
     */
    public record TripSpotDetailResponse(
        Long spotId,
        String spotName,
        String coverUrl,
        Integer sortOrder,
        Integer suggestedDuration
    ) {
    }

    /**
     * 行程中的完整节点明细，兼容完整行程里的午餐、休息、酒店等非景点节点。
     */
    public record TripItemDetailResponse(
        Long spotId,
        String itemType,
        String itemName,
        String coverUrl,
        BigDecimal lng,
        BigDecimal lat,
        Integer sortOrder,
        Integer suggestedDuration,
        String startTime,
        String endTime
    ) {
    }
}
