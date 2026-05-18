package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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
import com.trailmap.model.query.FavoriteSpotQuery;
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
import org.springframework.util.StringUtils;

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
    public PageResponse<FavoriteSpotItemResponse> listFavoriteSpots(Long userId, FavoriteSpotQuery query, PageQuery pageQuery) {
        Map<Long, City> cityMap = cityMapper.selectList(new LambdaQueryWrapper<City>()
                        .eq(City::getStatus, 1))
                .stream()
                .collect(Collectors.toMap(City::getId, Function.identity()));
        Map<Long, List<SpotTagResponse>> tagMapping = buildSpotTagMapping();
        LambdaQueryWrapper<UserFavoriteSpot> favoriteQuery = new LambdaQueryWrapper<UserFavoriteSpot>()
                .eq(UserFavoriteSpot::getUserId, userId);
        validateSortBy(query.sortBy());

        if (query.favoritedWithinDays() != null) {
            favoriteQuery.ge(
                    UserFavoriteSpot::getCreatedAt,
                    LocalDateTime.now().minusDays(query.favoritedWithinDays()));
        }

        if (!pageQuery.isPaged()) {
            List<FavoriteSpotItemResponse> items = userFavoriteSpotMapper.selectList(favoriteQuery)
                    .stream()
                    .map(favorite -> toFavoriteItemResponse(favorite, cityMap, tagMapping))
                    .filter(item -> item != null)
                    .filter(item -> matchesFavoriteQuery(item, query))
                    .sorted(buildFavoriteComparator(query.sortBy()))
                    .toList();
            return PageResponse.unpaged(items);
        }

        // 分页总数必须基于“完整筛选结果”计算，不能先按页截断再统计，否则 total 会被误算成当前窗口条数。
        List<FavoriteSpotItemResponse> matchedItems = userFavoriteSpotMapper.selectList(favoriteQuery)
                .stream()
                .map(favorite -> toFavoriteItemResponse(favorite, cityMap, tagMapping))
                .filter(item -> item != null)
                .filter(item -> matchesFavoriteQuery(item, query))
                .sorted(buildFavoriteComparator(query.sortBy()))
                .toList();
        int startIndex = Math.max(0, (int) ((pageQuery.resolvedPageNum() - 1) * pageQuery.resolvedPageSize()));
        int endIndex = Math.min(matchedItems.size(), startIndex + (int) pageQuery.resolvedPageSize());
        List<FavoriteSpotItemResponse> pagedItems = startIndex >= matchedItems.size()
                ? List.of()
                : matchedItems.subList(startIndex, endIndex);
        return PageResponse.paged(pagedItems, matchedItems.size(), pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize());
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

    private boolean matchesFavoriteQuery(FavoriteSpotItemResponse item, FavoriteSpotQuery query) {
        boolean matchesType = !StringUtils.hasText(query.type()) || item.type().equals(query.type());
        boolean matchesCity = !StringUtils.hasText(query.cityName()) || item.cityName().equals(query.cityName().trim());
        return matchesType && matchesCity;
    }

    private Comparator<FavoriteSpotItemResponse> buildFavoriteComparator(String sortBy) {
        if ("score".equals(sortBy)) {
            return Comparator
                    .comparing(FavoriteSpotItemResponse::recommendScore, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(FavoriteSpotItemResponse::favoritedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        }
        return Comparator
                .comparing(FavoriteSpotItemResponse::favoritedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(FavoriteSpotItemResponse::favoriteId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private void validateSortBy(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            return;
        }
        if (!"latest".equals(sortBy) && !"score".equals(sortBy)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的收藏排序方式: " + sortBy);
        }
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
