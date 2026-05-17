package com.trailmap.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 管理端景点响应对象，返回景点维护场景需要的完整基础字段。
 */
public record AdminSpotResponse(
        Long id,
        Long cityId,
        String cityName,
        String name,
        String type,
        CoordinateResponse position,
        String address,
        String amapPoiId,
        String boundaryGeojson,
        String coverUrl,
        String summary,
        String description,
        String recommendReason,
        String travelGuide,
        String openingHours,
        String ticketInfo,
        Integer suggestedDurationMinutes,
        String bestTime,
        BigDecimal recommendScore,
        Integer hotScore,
        String suitableCrowd,
        boolean free,
        boolean indoor,
        boolean night,
        boolean rainyDay,
        boolean subwayFriendly,
        boolean firstVisit,
        Integer sortOrder,
        Integer status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
