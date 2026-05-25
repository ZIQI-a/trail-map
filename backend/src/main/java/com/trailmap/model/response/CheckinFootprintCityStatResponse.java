package com.trailmap.model.response;

/**
 * 足迹地图省份视图的市级聚合统计。
 */
public record CheckinFootprintCityStatResponse(
        Long cityId,
        String cityName,
        String provinceName,
        CoordinateResponse center,
        long checkinCount
) {
}
