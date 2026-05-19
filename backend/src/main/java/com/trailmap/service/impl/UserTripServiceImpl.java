package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.entity.Spot;
import com.trailmap.entity.UserTrip;
import com.trailmap.entity.UserTripSpot;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.mapper.UserTripMapper;
import com.trailmap.mapper.UserTripSpotMapper;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SaveTripRequest;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.TripDetailResponse;
import com.trailmap.model.response.TripSummaryResponse;
import com.trailmap.service.UserTripService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户行程服务实现类。
 */
@Service
public class UserTripServiceImpl implements UserTripService {

    private final UserTripMapper userTripMapper;
    private final UserTripSpotMapper userTripSpotMapper;
    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;

    public UserTripServiceImpl(
            UserTripMapper userTripMapper,
            UserTripSpotMapper userTripSpotMapper,
            CityMapper cityMapper,
            SpotMapper spotMapper
    ) {
        this.userTripMapper = userTripMapper;
        this.userTripSpotMapper = userTripSpotMapper;
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long saveTrip(Long userId, SaveTripRequest request) {
        // 1. 校验城市是否存在
        City city = cityMapper.selectById(request.getCityId());
        if (city == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "指定的城市不存在");
        }

        // 2. 创建行程主表记录
        UserTrip trip = new UserTrip();
        trip.setUserId(userId);
        trip.setCityId(request.getCityId());
        trip.setTripName(request.getTripName());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setDays(request.getDays());
        trip.setTransportType(request.getTransportType());
        trip.setPlanMode(request.getPlanMode());
        trip.setRouteRecordId(request.getRouteRecordId());
        trip.setCoverUrl(request.getCoverUrl() != null ? request.getCoverUrl() : city.getCoverUrl());
        trip.setStatus(1);
        trip.setCreatedAt(LocalDateTime.now());
        trip.setUpdatedAt(LocalDateTime.now());

        userTripMapper.insert(trip);

        // 3. 批量创建景点明细记录
        List<UserTripSpot> spots = request.getSpots().stream().map(s -> {
            UserTripSpot spotDetail = new UserTripSpot();
            spotDetail.setTripId(trip.getId());
            spotDetail.setSpotId(s.getSpotId());
            spotDetail.setDayIndex(s.getDayIndex());
            spotDetail.setSortOrder(s.getSortOrder());
            spotDetail.setSuggestedDuration(s.getSuggestedDuration());
            spotDetail.setCreatedAt(LocalDateTime.now());
            return spotDetail;
        }).collect(Collectors.toList());

        for (UserTripSpot spot : spots) {
            userTripSpotMapper.insert(spot);
        }

        return trip.getId();
    }

    @Override
    public PageResponse<TripSummaryResponse> listUserTrips(Long userId, PageQuery pageQuery) {
        Page<UserTrip> page = userTripMapper.selectPage(
                new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()),
                new LambdaQueryWrapper<UserTrip>()
                        .eq(UserTrip::getUserId, userId)
                        .eq(UserTrip::getStatus, 1)
                        .orderByDesc(UserTrip::getCreatedAt)
        );

        List<Long> cityIds = page.getRecords().stream().map(UserTrip::getCityId).distinct().toList();
        Map<Long, String> cityIdToName = cityMapper.selectBatchIds(cityIds).stream()
                .collect(Collectors.toMap(City::getId, City::getCityName));

        List<TripSummaryResponse> list = page.getRecords().stream().map(t -> new TripSummaryResponse(
                t.getId(),
                t.getCityId(),
                cityIdToName.getOrDefault(t.getCityId(), "未知城市"),
                t.getTripName(),
                t.getStartDate(),
                t.getEndDate(),
                t.getDays(),
                t.getTransportType(),
                t.getPlanMode(),
                t.getCoverUrl(),
                t.getCreatedAt()
        )).toList();

        return PageResponse.paged(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public TripDetailResponse getTripDetail(Long userId, Long tripId) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        City city = cityMapper.selectById(trip.getCityId());
        List<UserTripSpot> spotDetails = userTripSpotMapper.selectList(
                new LambdaQueryWrapper<UserTripSpot>()
                        .eq(UserTripSpot::getTripId, tripId)
                        .orderByAsc(UserTripSpot::getDayIndex, UserTripSpot::getSortOrder)
        );

        List<Long> spotIds = spotDetails.stream().map(UserTripSpot::getSpotId).toList();
        Map<Long, Spot> spotMap = spotMapper.selectBatchIds(spotIds).stream()
                .collect(Collectors.toMap(Spot::getId, s -> s));

        // 按天分组并转换
        Map<Integer, List<UserTripSpot>> groupedSpots = spotDetails.stream()
                .collect(Collectors.groupingBy(UserTripSpot::getDayIndex));

        List<TripDetailResponse.TripDaySpotsResponse> itineraryDays = groupedSpots.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<TripDetailResponse.TripSpotDetailResponse> spots = entry.getValue().stream()
                            .map(sd -> {
                                Spot s = spotMap.get(sd.getSpotId());
                                return new TripDetailResponse.TripSpotDetailResponse(
                                        sd.getSpotId(),
                                        s != null ? s.getSpotName() : "未知景点",
                                        s != null ? s.getCoverUrl() : null,
                                        sd.getSortOrder(),
                                        sd.getSuggestedDuration()
                                );
                            }).toList();
                    return new TripDetailResponse.TripDaySpotsResponse(entry.getKey(), spots);
                }).toList();

        return new TripDetailResponse(
                trip.getId(),
                trip.getCityId(),
                city != null ? city.getCityName() : "未知城市",
                trip.getTripName(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getDays(),
                trip.getTransportType(),
                trip.getPlanMode(),
                trip.getRouteRecordId(),
                trip.getCoverUrl(),
                trip.getCreatedAt(),
                itineraryDays
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTrip(Long userId, Long tripId) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        // 软删除行程主表
        trip.setStatus(0);
        trip.setUpdatedAt(LocalDateTime.now());
        userTripMapper.updateById(trip);

        // 明细表通常随主表逻辑隐藏，如果需要物理删除则在这里执行：
        // userTripSpotMapper.delete(new LambdaQueryWrapper<UserTripSpot>().eq(UserTripSpot::getTripId, tripId));
    }
}
