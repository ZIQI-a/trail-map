package com.trailmap.model.response;

/**
 * 收藏状态响应对象，供前端决定收藏按钮展示。
 */
public record FavoriteSpotStatusResponse(
        boolean favorited
) {
}
