package com.trailmap.model.response;

import java.math.BigDecimal;

/**
 * 市级足迹聚合查询记录，供 Mapper XML 直接映射。
 */
public record CheckinFootprintCityStatRecord(
        Long cityId,
        String cityName,
        String provinceName,
        BigDecimal centerLng,
        BigDecimal centerLat,
        long checkinCount
) {
}
