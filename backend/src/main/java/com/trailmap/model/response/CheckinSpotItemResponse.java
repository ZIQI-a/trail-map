package com.trailmap.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 我的打卡景点列表项，供后续“我的足迹”页面展示。
 */
public record CheckinSpotItemResponse(
        Long checkinId,
        Long spotId,
        Long cityId,
        String cityName,
        String name,
        String type,
        CoordinateResponse position,
        String address,
        String coverUrl,
        String summary,
        String recommendReason,
        String openingHours,
        String ticketInfo,
        Integer suggestedDurationMinutes,
        String bestTime,
        BigDecimal recommendScore,
        Integer hotScore,
        boolean free,
        boolean indoor,
        boolean night,
        boolean rainyDay,
        boolean subwayFriendly,
        boolean firstVisit,
        LocalDateTime checkedInAt,
        CoordinateResponse checkinPosition,
        String remark,
        List<SpotTagResponse> tags
) {
}
