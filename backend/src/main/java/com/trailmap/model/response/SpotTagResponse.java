package com.trailmap.model.response;

/**
 * 景点标签响应对象。
 */
public record SpotTagResponse(
        Long id,
        String name,
        String code,
        String type,
        Integer sortOrder
) {
}
