package com.trailmap.model.response;

/**
 * 个人主页概览响应，统一返回用户画像页需要的核心统计。
 */
public record UserProfileOverviewResponse(
        long visitedCityCount,
        long favoriteSpotCount,
        long checkinSpotCount,
        long tripCount,
        long totalTravelDays,
        String recentCityName
) {
}
