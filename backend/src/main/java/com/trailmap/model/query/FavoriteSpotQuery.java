package com.trailmap.model.query;

/**
 * 收藏景点查询对象，承接收藏页的筛选、时间范围和排序参数。
 */
public record FavoriteSpotQuery(
        String type,
        String cityName,
        Integer favoritedWithinDays,
        String sortBy
) {
}
