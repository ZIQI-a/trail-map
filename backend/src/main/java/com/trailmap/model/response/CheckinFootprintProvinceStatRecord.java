package com.trailmap.model.response;

/**
 * 省级足迹聚合查询记录，供 Mapper XML 直接映射。
 */
public record CheckinFootprintProvinceStatRecord(
        String provinceName,
        long checkinCount,
        long cityCount
) {
}
