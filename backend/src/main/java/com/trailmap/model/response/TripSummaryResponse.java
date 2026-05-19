package com.trailmap.model.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 行程列表简要信息响应。
 */
public record TripSummaryResponse(
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
    String coverUrl,
    LocalDateTime createdAt
) {
}
