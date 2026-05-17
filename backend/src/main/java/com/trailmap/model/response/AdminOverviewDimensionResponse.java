package com.trailmap.model.response;

/**
 * 管理端概览维度统计项，用于图表展示分类名称、编码和值。
 */
public record AdminOverviewDimensionResponse(
        String code,
        String label,
        Long value
) {
}
