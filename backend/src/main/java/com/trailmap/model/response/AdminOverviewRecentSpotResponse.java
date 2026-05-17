package com.trailmap.model.response;

import java.time.LocalDateTime;

/**
 * 管理端概览最近更新景点，用于首页快速查看内容维护动态。
 */
public record AdminOverviewRecentSpotResponse(
        Long id,
        String name,
        String cityName,
        String type,
        Integer status,
        LocalDateTime updatedAt
) {
}
