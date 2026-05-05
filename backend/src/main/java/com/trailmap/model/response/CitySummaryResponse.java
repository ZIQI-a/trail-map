package com.trailmap.model.response;

import java.math.BigDecimal;

/**
 * 城市列表响应对象，字段贴近前端地图工作台静态数据结构。
 */
public record CitySummaryResponse(
        Long id,
        String name,
        String provinceName,
        String cityCode,
        CoordinateResponse center,
        Integer mapZoom,
        String coverUrl,
        String description,
        BigDecimal recommendDays,
        Integer hotScore
) {
}
