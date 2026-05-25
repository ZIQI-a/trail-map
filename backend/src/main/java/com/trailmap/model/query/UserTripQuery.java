package com.trailmap.model.query;

/**
 * 用户行程列表查询参数。
 *
 * @param cityName 城市名称精确筛选
 * @param planMode 行程类型筛选：schedule / free
 * @param sortBy 排序方式：latest / city
 */
public record UserTripQuery(
        String cityName,
        String planMode,
        String sortBy
) {
}
