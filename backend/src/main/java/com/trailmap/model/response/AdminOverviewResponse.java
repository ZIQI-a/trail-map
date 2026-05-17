package com.trailmap.model.response;

import java.util.List;

/**
 * 管理端数据概览响应，聚合用户、城市和景点的首页驾驶舱数据。
 */
public record AdminOverviewResponse(
        AdminOverviewMetricResponse metrics,
        List<AdminOverviewDimensionResponse> userRoleDistribution,
        List<AdminOverviewDimensionResponse> spotTypeDistribution,
        List<AdminOverviewDimensionResponse> citySpotRanking,
        List<AdminOverviewDimensionResponse> dataStatusDistribution,
        List<AppUserResponse> recentUsers,
        List<AdminOverviewRecentSpotResponse> recentSpots
) {
}
