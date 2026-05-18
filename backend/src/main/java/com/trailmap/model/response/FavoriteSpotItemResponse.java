package com.trailmap.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 我的收藏景点列表项，供前端收藏页卡片展示。
 */
public record FavoriteSpotItemResponse(
        Long favoriteId,
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
        LocalDateTime favoritedAt,
        List<SpotTagResponse> tags
) {
}
