package com.trailmap.model.response;

/**
 * 足迹地图全国视图的省级聚合统计。
 */
public record CheckinFootprintProvinceStatResponse(
        String provinceName,
        long checkinCount,
        long cityCount
) {
}
