package com.trailmap.service;

import com.trailmap.model.response.FavoriteSpotStatusResponse;

/**
 * 收藏景点服务接口，负责当前登录用户的收藏状态与切换操作。
 */
public interface FavoriteSpotService {

    FavoriteSpotStatusResponse getFavoriteStatus(Long userId, Long spotId);

    FavoriteSpotStatusResponse favoriteSpot(Long userId, Long spotId);

    FavoriteSpotStatusResponse unfavoriteSpot(Long userId, Long spotId);
}
