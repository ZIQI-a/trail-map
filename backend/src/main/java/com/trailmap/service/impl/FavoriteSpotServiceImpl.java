package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.entity.Spot;
import com.trailmap.entity.SpotTag;
import com.trailmap.entity.SpotTagRelation;
import com.trailmap.entity.UserFavoriteSpot;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.mapper.SpotTagMapper;
import com.trailmap.mapper.SpotTagRelationMapper;
import com.trailmap.mapper.UserFavoriteSpotMapper;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.FavoriteSpotItemResponse;
import com.trailmap.model.response.FavoriteSpotStatusResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.SpotTagResponse;
import com.trailmap.service.FavoriteSpotService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * 收藏景点服务实现，只影响当前登录用户的个人收藏关系，不改动公共景点数据。
 */
@Service
public class FavoriteSpotServiceImpl implements FavoriteSpotService {

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;
    private final SpotTagMapper spotTagMapper;
    private final SpotTagRelationMapper spotTagRelationMapper;
    private final UserFavoriteSpotMapper userFavoriteSpotMapper;

    public FavoriteSpotServiceImpl(
            CityMapper cityMapper,
            SpotMapper spotMapper,
            SpotTagMapper spotTagMapper,
            SpotTagRelationMapper spotTagRelationMapper,
            UserFavoriteSpotMapper userFavoriteSpotMapper) {
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
        this.spotTagMapper = spotTagMapper;
        this.spotTagRelationMapper = spotTagRelationMapper;
        this.userFavoriteSpotMapper = userFavoriteSpotMapper;
    }

    @Override
    public PageResponse<FavoriteSpotItemResponse> listFavoriteSpots(Long userId, PageQuery pageQuery) {
        Map<Long, City> cityMap = cityMapper.selectList(new LambdaQueryWrapper<City>()
                        .eq(City::getStatus, 1))
                .stream()
                .collect(Collectors.toMap(City::getId, Function.identity()));
        Map<Long, List<SpotTagResponse>> tagMapping = buildSpotTagMapping();
        LambdaQueryWrapper<UserFavoriteSpot> favoriteQuery = new LambdaQueryWrapper<UserFavoriteSpot>()
                .eq(UserFavoriteSpot::getUserId, userId)
                .orderByDesc(UserFavoriteSpot::getCreatedAt)
                .orderByDesc(UserFavoriteSpot::getId);

        if (!pageQuery.isPaged()) {
            List<FavoriteSpotItemResponse> items = userFavoriteSpotMapper.selectList(favoriteQuery)
                    .stream()
                    .map(favorite -> toFavoriteItemResponse(favorite, cityMap, tagMapping))
                    .filter(item -> item != null)
                    .toList();
            return PageResponse.unpaged(items);
        }

        Page<UserFavoriteSpot> page = userFavoriteSpotMapper.selectPage(
                new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()),
                favoriteQuery);
        List<FavoriteSpotItemResponse> items = page.getRecords()
                .stream()
                .map(favorite -> toFavoriteItemResponse(favorite, cityMap, tagMapping))
                .filter(item -> item != null)
                .toList();
        return PageResponse.paged(items, page.getTotal(), page.getCurrent(), page.getSize());
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

    private FavoriteSpotItemResponse toFavoriteItemResponse(
            UserFavoriteSpot favorite,
            Map<Long, City> cityMap,
            Map<Long, List<SpotTagResponse>> tagMapping) {
        Spot spot = spotMapper.selectOne(new LambdaQueryWrapper<Spot>()
                .eq(Spot::getId, favorite.getSpotId())
                .eq(Spot::getStatus, 1));
        if (spot == null) {
            return null;
        }

        City city = cityMap.get(spot.getCityId());
        return new FavoriteSpotItemResponse(
                favorite.getId(),
                spot.getId(),
                spot.getCityId(),
                city != null ? city.getCityName() : "",
                spot.getSpotName(),
                spot.getSpotType(),
                new CoordinateResponse(spot.getLng(), spot.getLat()),
                spot.getAddress(),
                spot.getCoverUrl(),
                spot.getSummary(),
                spot.getRecommendReason(),
                spot.getOpeningHours(),
                spot.getTicketInfo(),
                spot.getSuggestedDuration(),
                spot.getBestTime(),
                spot.getRecommendScore(),
                spot.getHotScore(),
                toBoolean(spot.getIsFree()),
                toBoolean(spot.getIsIndoor()),
                toBoolean(spot.getIsNight()),
                toBoolean(spot.getIsRainyDay()),
                toBoolean(spot.getSubwayFriendly()),
                toBoolean(spot.getFirstVisit()),
                favorite.getCreatedAt(),
                sortTags(tagMapping.getOrDefault(spot.getId(), List.of()))
        );
    }

    private Map<Long, List<SpotTagResponse>> buildSpotTagMapping() {
        Map<Long, SpotTag> tagMap = spotTagMapper.selectList(new LambdaQueryWrapper<SpotTag>()
                        .eq(SpotTag::getStatus, 1))
                .stream()
                .collect(Collectors.toMap(SpotTag::getId, Function.identity()));

        return spotTagRelationMapper.selectList(new LambdaQueryWrapper<SpotTagRelation>())
                .stream()
                .filter(relation -> tagMap.containsKey(relation.getTagId()))
                .collect(Collectors.groupingBy(
                        SpotTagRelation::getSpotId,
                        Collectors.mapping(relation -> toTagResponse(tagMap.get(relation.getTagId())), Collectors.toList())
                ));
    }

    private SpotTagResponse toTagResponse(SpotTag tag) {
        return new SpotTagResponse(tag.getId(), tag.getTagName(), tag.getTagCode(), tag.getTagType(), tag.getSortOrder());
    }

    private List<SpotTagResponse> sortTags(List<SpotTagResponse> tags) {
        return tags.stream()
                .sorted(Comparator.comparing(SpotTagResponse::sortOrder))
                .toList();
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

    private boolean toBoolean(Integer value) {
        return value != null && value == 1;
    }
}
