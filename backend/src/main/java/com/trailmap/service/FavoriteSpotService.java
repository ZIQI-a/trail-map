package com.trailmap.service;

import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.FavoriteSpotItemResponse;
import com.trailmap.model.response.FavoriteSpotStatusResponse;
import com.trailmap.model.response.PageResponse;

/**
 * 收藏景点服务接口，负责当前登录用户的收藏状态与切换操作。
 */
public interface FavoriteSpotService {

    PageResponse<FavoriteSpotItemResponse> listFavoriteSpots(Long userId, PageQuery pageQuery);

    FavoriteSpotStatusResponse getFavoriteStatus(Long userId, Long spotId);

    FavoriteSpotStatusResponse favoriteSpot(Long userId, Long spotId);

    FavoriteSpotStatusResponse unfavoriteSpot(Long userId, Long spotId);
}
