package com.trailmap.model.response;

import java.util.List;

/**
 * 足迹地图聚合响应，统一返回全国和省内视图所需的统计数据。
 */
public record CheckinFootprintResponse(
        long totalCheckinCount,
        long unlockedProvinceCount,
        List<CheckinFootprintProvinceStatResponse> provinces,
        List<CheckinFootprintCityStatResponse> cities
) {
}
