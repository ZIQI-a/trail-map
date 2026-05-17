package com.trailmap.model.response;

import java.math.BigDecimal;

/**
 * 管理端城市响应对象，在前台城市摘要基础上补齐状态和排序字段。
 */
public record AdminCityResponse(
        Long id,
        String name,
        String provinceName,
        String cityCode,
        CoordinateResponse center,
        Integer mapZoom,
        String coverUrl,
        String description,
        BigDecimal recommendDays,
        Integer hotScore,
        Integer sortOrder,
        Integer status
) {
}
