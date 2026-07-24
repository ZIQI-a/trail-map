package com.trailmap.model.response;

/**
 * 管理端城市候选项，同时携带所属省份，避免前端自由组合出错误归属关系。
 */
public record AdminCityOptionResponse(
        String code,
        String name,
        String provinceCode,
        String provinceName
) {
}
