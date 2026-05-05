package com.trailmap.model.query;

/**
 * 景点列表查询条件，统一收口后续方便扩展分页、排序和多标签查询。
 */
public record SpotQuery(
        String keyword,
        String type,
        String tagCode
) {
}
