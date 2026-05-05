package com.trailmap.model.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * 景点详情响应对象，在列表字段基础上补充详细介绍和攻略。
 */
public record SpotDetailResponse(
        Long id,
        Long cityId,
        String name,
        String type,
        CoordinateResponse position,
        String address,
        String amapPoiId,
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
        List<SpotTagResponse> tags
) {
}
