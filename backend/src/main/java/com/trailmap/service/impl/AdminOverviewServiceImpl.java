package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.trailmap.entity.AppUser;
import com.trailmap.entity.City;
import com.trailmap.entity.Spot;
import com.trailmap.enums.SpotType;
import com.trailmap.enums.UserType;
import com.trailmap.mapper.AppUserMapper;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.model.response.AdminOverviewDimensionResponse;
import com.trailmap.model.response.AdminOverviewMetricResponse;
import com.trailmap.model.response.AdminOverviewRecentSpotResponse;
import com.trailmap.model.response.AdminOverviewResponse;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.service.AdminOverviewService;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 管理端概览服务实现，集中做首页统计聚合，避免前端拉全量数据自行计算。
 */
@Service
public class AdminOverviewServiceImpl implements AdminOverviewService {

    private static final int STATUS_DELETED = 0;
    private static final int STATUS_ENABLED = 1;
    private static final int RECENT_LIMIT = 6;
    private static final int CITY_RANKING_LIMIT = 8;

    private final AppUserMapper appUserMapper;
    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;

    public AdminOverviewServiceImpl(
            AppUserMapper appUserMapper,
            CityMapper cityMapper,
            SpotMapper spotMapper) {
        this.appUserMapper = appUserMapper;
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
    }

    @Override
    public AdminOverviewResponse getOverview() {
        List<AppUser> users = appUserMapper.selectList(new LambdaQueryWrapper<AppUser>()
                .ne(AppUser::getStatus, STATUS_DELETED));
        List<City> cities = cityMapper.selectList(new LambdaQueryWrapper<>());
        List<Spot> spots = spotMapper.selectList(new LambdaQueryWrapper<>());
        Map<Long, City> cityMap = cities.stream()
                .collect(Collectors.toMap(City::getId, Function.identity(), (left, right) -> left));

        return new AdminOverviewResponse(
                buildMetrics(users, cities, spots),
                buildUserRoleDistribution(users),
                buildSpotTypeDistribution(spots),
                buildCitySpotRanking(cities, spots),
                buildDataStatusDistribution(cities, spots),
                buildRecentUsers(users),
                buildRecentSpots(spots, cityMap)
        );
    }

    /**
     * 首页核心指标：用户不统计已删除账号，城市和景点按当前后台数据统计。
     */
    private AdminOverviewMetricResponse buildMetrics(List<AppUser> users, List<City> cities, List<Spot> spots) {
        return new AdminOverviewMetricResponse(
                (long) users.size(),
                countUsersByType(users, UserType.NORMAL.getCode()),
                countUsersByType(users, UserType.MEMBER.getCode()),
                countByStatus(users.stream().map(AppUser::getStatus).toList(), STATUS_ENABLED),
                users.stream().filter(user -> !statusEquals(user.getStatus(), STATUS_ENABLED)).count(),
                (long) cities.size(),
                countByStatus(cities.stream().map(City::getStatus).toList(), STATUS_ENABLED),
                cities.stream().filter(city -> !statusEquals(city.getStatus(), STATUS_ENABLED)).count(),
                (long) spots.size(),
                countByStatus(spots.stream().map(Spot::getStatus).toList(), STATUS_ENABLED),
                spots.stream().filter(spot -> !statusEquals(spot.getStatus(), STATUS_ENABLED)).count(),
                spots.stream().filter(spot -> !StringUtils.hasText(spot.getCoverUrl())).count(),
                spots.stream().filter(spot -> spot.getRecommendScore() == null).count()
        );
    }

    /**
     * 用户角色分布按产品要求排除管理员，只展示普通用户和会员。
     */
    private List<AdminOverviewDimensionResponse> buildUserRoleDistribution(List<AppUser> users) {
        return List.of(
                new AdminOverviewDimensionResponse(UserType.NORMAL.getCode(), "普通用户", countUsersByType(users, UserType.NORMAL.getCode())),
                new AdminOverviewDimensionResponse(UserType.MEMBER.getCode(), "会员用户", countUsersByType(users, UserType.MEMBER.getCode()))
        );
    }

    private List<AdminOverviewDimensionResponse> buildSpotTypeDistribution(List<Spot> spots) {
        return List.of(SpotType.values()).stream()
                .map(type -> new AdminOverviewDimensionResponse(
                        type.getCode(),
                        type.getLabel(),
                        spots.stream().filter(spot -> type.getCode().equals(spot.getSpotType())).count()))
                .toList();
    }

    private List<AdminOverviewDimensionResponse> buildCitySpotRanking(List<City> cities, List<Spot> spots) {
        Map<Long, Long> spotCountByCity = spots.stream()
                .collect(Collectors.groupingBy(Spot::getCityId, Collectors.counting()));
        return cities.stream()
                .map(city -> new AdminOverviewDimensionResponse(
                        String.valueOf(city.getId()),
                        city.getCityName(),
                        spotCountByCity.getOrDefault(city.getId(), 0L)))
                .sorted(Comparator.comparing(AdminOverviewDimensionResponse::value).reversed())
                .limit(CITY_RANKING_LIMIT)
                .toList();
    }

    private List<AdminOverviewDimensionResponse> buildDataStatusDistribution(List<City> cities, List<Spot> spots) {
        long enabledCities = cities.stream().filter(city -> statusEquals(city.getStatus(), STATUS_ENABLED)).count();
        long disabledCities = cities.size() - enabledCities;
        long enabledSpots = spots.stream().filter(spot -> statusEquals(spot.getStatus(), STATUS_ENABLED)).count();
        long disabledSpots = spots.size() - enabledSpots;
        return List.of(
                new AdminOverviewDimensionResponse("enabled_cities", "启用城市", enabledCities),
                new AdminOverviewDimensionResponse("disabled_cities", "停用城市", disabledCities),
                new AdminOverviewDimensionResponse("enabled_spots", "启用景点", enabledSpots),
                new AdminOverviewDimensionResponse("disabled_spots", "停用景点", disabledSpots)
        );
    }

    private List<AppUserResponse> buildRecentUsers(List<AppUser> users) {
        return users.stream()
                .sorted(Comparator.comparing(AppUser::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_LIMIT)
                .map(this::toUserResponse)
                .toList();
    }

    private List<AdminOverviewRecentSpotResponse> buildRecentSpots(List<Spot> spots, Map<Long, City> cityMap) {
        return spots.stream()
                .sorted(Comparator.comparing(Spot::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_LIMIT)
                .map(spot -> new AdminOverviewRecentSpotResponse(
                        spot.getId(),
                        spot.getSpotName(),
                        cityMap.containsKey(spot.getCityId()) ? cityMap.get(spot.getCityId()).getCityName() : "未知城市",
                        spot.getSpotType(),
                        spot.getStatus(),
                        spot.getUpdatedAt()))
                .toList();
    }

    private long countUsersByType(List<AppUser> users, String userType) {
        return users.stream().filter(user -> userType.equals(user.getUserType())).count();
    }

    private long countByStatus(List<Integer> statuses, int status) {
        return statuses.stream().filter(value -> statusEquals(value, status)).count();
    }

    private boolean statusEquals(Integer sourceStatus, int targetStatus) {
        return sourceStatus != null && sourceStatus == targetStatus;
    }

    private AppUserResponse toUserResponse(AppUser user) {
        return new AppUserResponse(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getUserType(),
                user.getAvatarUrl(),
                user.getPhone(),
                user.getEmail(),
                user.getStatus(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
