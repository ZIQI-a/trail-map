package com.trailmap.model.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户行程列表基础查询记录，承接 SQL 关联查询结果。
 */
public record TripSummaryBaseRecord(
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
        Integer isPublic,
        String shareToken,
        LocalDateTime createdAt
) {
}
