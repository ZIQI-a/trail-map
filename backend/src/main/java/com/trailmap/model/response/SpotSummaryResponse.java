package com.trailmap.model.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * 景点列表项响应对象，满足地图点位、左侧推荐列表和卡片展示。
 */
public record SpotSummaryResponse(
        Long id,
        Long cityId,
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
        List<SpotTagResponse> tags
) {
}
