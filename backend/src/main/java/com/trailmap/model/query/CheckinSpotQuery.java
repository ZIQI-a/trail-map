package com.trailmap.model.query;

/**
 * 打卡景点查询对象，承接“我的足迹”页面的筛选和排序参数。
 */
public record CheckinSpotQuery(
        String tagCode,
        String cityName,
        Integer checkedInWithinDays,
        String sortBy
) {
}
