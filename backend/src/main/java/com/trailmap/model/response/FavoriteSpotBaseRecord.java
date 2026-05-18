package com.trailmap.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 收藏景点基础查询结果，承接联表分页查询的原始字段。
 */
public record FavoriteSpotBaseRecord(
        Long favoriteId,
        Long spotId,
        Long cityId,
        String cityName,
        String name,
        String type,
        BigDecimal lng,
        BigDecimal lat,
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
        Integer isFree,
        Integer isIndoor,
        Integer isNight,
        Integer isRainyDay,
        Integer subwayFriendly,
        Integer firstVisit,
        LocalDateTime favoritedAt
) {
}
