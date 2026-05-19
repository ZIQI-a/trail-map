package com.trailmap.model.response;

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
    LocalDate startDate,
    LocalDate endDate,
    Integer days,
    String transportType,
    String planMode,
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
        List<TripSpotDetailResponse> spots
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
}
