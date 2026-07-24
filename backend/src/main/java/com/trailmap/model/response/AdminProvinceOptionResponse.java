package com.trailmap.model.response;

/**
 * 管理端省级行政区候选项，编码采用六位国标行政区划编码。
 */
public record AdminProvinceOptionResponse(
        String code,
        String name
) {
}
