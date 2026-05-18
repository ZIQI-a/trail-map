package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.Spot;
import com.trailmap.entity.UserFavoriteSpot;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.mapper.UserFavoriteSpotMapper;
import com.trailmap.model.response.FavoriteSpotStatusResponse;
import com.trailmap.service.FavoriteSpotService;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

/**
 * 收藏景点服务实现，只影响当前登录用户的个人收藏关系，不改动公共景点数据。
 */
@Service
public class FavoriteSpotServiceImpl implements FavoriteSpotService {

    private final SpotMapper spotMapper;
    private final UserFavoriteSpotMapper userFavoriteSpotMapper;

    public FavoriteSpotServiceImpl(
            SpotMapper spotMapper,
            UserFavoriteSpotMapper userFavoriteSpotMapper) {
        this.spotMapper = spotMapper;
        this.userFavoriteSpotMapper = userFavoriteSpotMapper;
    }

    @Override
    public FavoriteSpotStatusResponse getFavoriteStatus(Long userId, Long spotId) {
        validateSpotAvailable(spotId);
        return new FavoriteSpotStatusResponse(isFavorited(userId, spotId));
    }

    @Override
    public FavoriteSpotStatusResponse favoriteSpot(Long userId, Long spotId) {
        validateSpotAvailable(spotId);
        if (!isFavorited(userId, spotId)) {
            UserFavoriteSpot favoriteSpot = new UserFavoriteSpot();
            favoriteSpot.setUserId(userId);
            favoriteSpot.setSpotId(spotId);
            favoriteSpot.setCreatedAt(LocalDateTime.now());
            userFavoriteSpotMapper.insert(favoriteSpot);
        }
        return new FavoriteSpotStatusResponse(true);
    }

    @Override
    public FavoriteSpotStatusResponse unfavoriteSpot(Long userId, Long spotId) {
        validateSpotAvailable(spotId);
        userFavoriteSpotMapper.delete(new LambdaUpdateWrapper<UserFavoriteSpot>()
                .eq(UserFavoriteSpot::getUserId, userId)
                .eq(UserFavoriteSpot::getSpotId, spotId));
        return new FavoriteSpotStatusResponse(false);
    }

    private boolean isFavorited(Long userId, Long spotId) {
        Long count = userFavoriteSpotMapper.selectCount(new LambdaQueryWrapper<UserFavoriteSpot>()
                .eq(UserFavoriteSpot::getUserId, userId)
                .eq(UserFavoriteSpot::getSpotId, spotId));
        return count != null && count > 0;
    }

    // 收藏动作只允许针对当前可见景点执行，避免前端保留过期景点 id 造成脏数据。
    private void validateSpotAvailable(Long spotId) {
        Spot spot = spotMapper.selectOne(new LambdaQueryWrapper<Spot>()
                .eq(Spot::getId, spotId)
                .eq(Spot::getStatus, 1));
        if (spot == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "景点不存在或已下线");
        }
    }
}
