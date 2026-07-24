package com.trailmap.model.response;

/**
 * 管理端已解析城市资料，供表单一次性回填名称、编码和中心点。
 */
public record AdminCityLocationResponse(
        String cityName,
        String provinceName,
        String cityCode,
        CoordinateResponse center
) {
}
