package com.trailmap.model.response;

/**
 * 行程公开分享状态响应。
 */
public record TripShareResponse(
        Long tripId,
        Boolean isPublic,
        String shareToken
) {
}
