package com.trailmap.model.response;

/**
 * 管理端概览核心指标，包含总量、启用量和异常量等首页卡片数据。
 */
public record AdminOverviewMetricResponse(
        Long totalUsers,
        Long normalUsers,
        Long memberUsers,
        Long enabledUsers,
        Long disabledUsers,
        Long totalCities,
        Long enabledCities,
        Long disabledCities,
        Long totalSpots,
        Long enabledSpots,
        Long disabledSpots,
        Long missingCoverSpots,
        Long missingScoreSpots
) {
}
