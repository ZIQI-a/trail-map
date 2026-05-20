package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.entity.RouteRecord;
import com.trailmap.entity.RouteSegment;
import com.trailmap.entity.Spot;
import com.trailmap.entity.UserTrip;
import com.trailmap.entity.UserTripItem;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.RouteRecordMapper;
import com.trailmap.mapper.RouteSegmentMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.mapper.UserTripMapper;
import com.trailmap.mapper.UserTripItemMapper;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SaveTripRequest;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.TripDetailResponse;
import com.trailmap.model.response.TripSummaryResponse;
import com.trailmap.service.UserTripService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 用户行程服务实现类。
 * 已适配真实业务逻辑：支持多天行程持久化，包含所有节点类型及路线细节。
 */
@Service
public class UserTripServiceImpl implements UserTripService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final UserTripMapper userTripMapper;
    private final UserTripItemMapper userTripItemMapper;
    private final RouteRecordMapper routeRecordMapper;
    private final RouteSegmentMapper routeSegmentMapper;
    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;

    public UserTripServiceImpl(
            UserTripMapper userTripMapper,
            UserTripItemMapper userTripItemMapper,
            RouteRecordMapper routeRecordMapper,
            RouteSegmentMapper routeSegmentMapper,
            CityMapper cityMapper,
            SpotMapper spotMapper) {
        this.userTripMapper = userTripMapper;
        this.userTripItemMapper = userTripItemMapper;
        this.routeRecordMapper = routeRecordMapper;
        this.routeSegmentMapper = routeSegmentMapper;
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long saveTrip(Long userId, SaveTripRequest request) {
        // 1. 校验城市、节点和已存在路线归属，避免脏数据或越权关联。
        City city = cityMapper.selectById(request.getCityId());
        if (city == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "指定的城市不存在");
        }
        validateTripRequest(userId, request);

        // 2. 如果传了路线分段，先持久化 route_record 和 route_segment。
        Long routeRecordId = null;
        if (request.getSegments() != null && !request.getSegments().isEmpty()) {
            routeRecordId = persistRouteData(userId, request);
        }

        // 3. 创建行程主表记录
        UserTrip trip = new UserTrip();
        trip.setUserId(userId);
        trip.setCityId(request.getCityId());
        trip.setTripName(request.getTripName());
        trip.setStartName(request.getStartName());
        trip.setEndName(request.getEndName());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setDays(request.getDays());
        trip.setTransportType(request.getTransportType());
        trip.setPlanMode(request.getPlanMode());
        trip.setRouteRecordId(routeRecordId != null ? routeRecordId : request.getRouteRecordId());
        trip.setTotalDistance(request.getTotalDistance() != null ? request.getTotalDistance() : 0);
        trip.setTotalTravelDuration(request.getTotalTravelDuration() != null ? request.getTotalTravelDuration() : 0);
        trip.setTotalStayDuration(request.getTotalStayDuration() != null ? request.getTotalStayDuration() : 0);
        trip.setTotalTripDuration(request.getTotalTripDuration() != null ? request.getTotalTripDuration() : 0);
        trip.setCoverUrl(request.getCoverUrl() != null ? request.getCoverUrl() : city.getCoverUrl());
        trip.setStatus(1);
        trip.setCreatedAt(LocalDateTime.now());
        trip.setUpdatedAt(LocalDateTime.now());

        userTripMapper.insert(trip);

        // 4. 批量创建项目明细记录（包含景点、午餐等）
        for (SaveTripRequest.TripItemRequest itemReq : request.getItems()) {
            UserTripItem item = new UserTripItem();
            item.setTripId(trip.getId());
            item.setSpotId(itemReq.getSpotId());
            item.setItemType(itemReq.getItemType());
            item.setItemName(itemReq.getItemName());
            if (itemReq.getPosition() != null) {
                item.setLng(itemReq.getPosition().lng());
                item.setLat(itemReq.getPosition().lat());
            }
            item.setStartTime(itemReq.getStartTime());
            item.setEndTime(itemReq.getEndTime());
            item.setDayIndex(itemReq.getDayIndex());
            item.setSortOrder(itemReq.getSortOrder());
            item.setSuggestedDuration(itemReq.getSuggestedDuration());
            item.setCreatedAt(LocalDateTime.now());
            userTripItemMapper.insert(item);
        }

        return trip.getId();
    }

    private Long persistRouteData(Long userId, SaveTripRequest request) {
        RouteRecord record = new RouteRecord();
        record.setCityId(request.getCityId());
        record.setUserId(userId);
        record.setStartName(request.getStartName());
        if (request.getStartPosition() != null) {
            record.setStartLng(request.getStartPosition().lng());
            record.setStartLat(request.getStartPosition().lat());
        }
        record.setEndName(request.getEndName());
        if (request.getEndPosition() != null) {
            record.setEndLng(request.getEndPosition().lng());
            record.setEndLat(request.getEndPosition().lat());
        }
        record.setTransportType(request.getTransportType());
        record.setPlanMode(request.getPlanMode());
        // 记录输入景点序列
        record.setSpotIds(request.getItems().stream()
                .filter(i -> "spot".equals(i.getItemType()) && i.getSpotId() != null)
                .map(i -> String.valueOf(i.getSpotId()))
                .collect(Collectors.joining(",")));
        record.setTotalDistance(request.getTotalDistance() != null ? request.getTotalDistance() : 0);
        // route_record 的 duration 对应交通耗时
        record.setTotalDuration(request.getTotalTravelDuration() != null ? request.getTotalTravelDuration() : 0);
        record.setRouteSummary(request.getRouteSummary());
        record.setStatus(1);
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());

        routeRecordMapper.insert(record);

        for (SaveTripRequest.RouteSegmentRequest sr : request.getSegments()) {
            RouteSegment segment = new RouteSegment();
            segment.setRouteRecordId(record.getId());
            segment.setDayIndex(sr.getDayIndex());
            segment.setSegmentIndex(sr.getSegmentIndex());
            segment.setFromName(sr.getFromName());
            if (sr.getFromPosition() != null) {
                segment.setFromLng(sr.getFromPosition().lng());
                segment.setFromLat(sr.getFromPosition().lat());
            }
            segment.setToName(sr.getToName());
            if (sr.getToPosition() != null) {
                segment.setToLng(sr.getToPosition().lng());
                segment.setToLat(sr.getToPosition().lat());
            }
            segment.setTransportType(sr.getTransportType());
            segment.setDistance(sr.getDistance());
            segment.setDuration(sr.getDuration());
            segment.setInstruction(sr.getInstruction());
            try {
                if (sr.getPolyline() != null) {
                    segment.setPolyline(OBJECT_MAPPER.writeValueAsString(sr.getPolyline()));
                }
                if (sr.getSteps() != null) {
                    segment.setStepsJson(OBJECT_MAPPER.writeValueAsString(sr.getSteps()));
                }
            } catch (JsonProcessingException e) {
                // ignore
            }
            segment.setCreatedAt(LocalDateTime.now());
            routeSegmentMapper.insert(segment);
        }

        return record.getId();
    }

    /**
     * 保存前统一做业务校验，避免把数据库约束异常暴露成 500。
     */
    private void validateTripRequest(Long userId, SaveTripRequest request) {
        validateRouteRecordOwnership(userId, request);
        validateTripItems(request);
        validateSegments(request);
    }

    /**
     * 如果前端复用了已有路线记录，必须保证归属当前用户且属于同一城市。
     */
    private void validateRouteRecordOwnership(Long userId, SaveTripRequest request) {
        if (request.getRouteRecordId() == null || (request.getSegments() != null && !request.getSegments().isEmpty())) {
            return;
        }
        RouteRecord record = routeRecordMapper.selectById(request.getRouteRecordId());
        if (record == null || !userId.equals(record.getUserId())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "关联的路线记录不存在或无权使用");
        }
        if (!request.getCityId().equals(record.getCityId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "路线记录与当前城市不匹配");
        }
    }

    /**
     * 节点既要符合 itemType 语义，也要保证景点节点来自当前城市且未下线。
     */
    private void validateTripItems(SaveTripRequest request) {
        Set<String> sortOrderKeys = new HashSet<>();
        List<Long> spotIds = request.getItems().stream()
                .filter(item -> item.getSpotId() != null)
                .map(SaveTripRequest.TripItemRequest::getSpotId)
                .distinct()
                .toList();
        Map<Long, Spot> spotMap = spotIds.isEmpty()
                ? Map.of()
                : spotMapper.selectBatchIds(spotIds).stream()
                        .collect(Collectors.toMap(Spot::getId, spot -> spot));

        for (SaveTripRequest.TripItemRequest item : request.getItems()) {
            validateSingleTripItem(request, item, spotMap, sortOrderKeys);
        }
    }

    /**
     * 单个节点校验
     **/
    private void validateSingleTripItem(
            SaveTripRequest request,
            SaveTripRequest.TripItemRequest item,
            Map<Long, Spot> spotMap,
            Set<String> sortOrderKeys) {
        if (!isSupportedItemType(item.getItemType())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的行程节点类型: " + item.getItemType());
        }
        if (item.getDayIndex() == null || item.getDayIndex() < 1 || item.getDayIndex() > request.getDays()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "行程节点天数索引超出范围");
        }
        if (item.getSortOrder() == null || item.getSortOrder() < 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "行程节点排序号必须大于 0");
        }
        String uniqueSortKey = item.getDayIndex() + "-" + item.getSortOrder();
        if (!sortOrderKeys.add(uniqueSortKey)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "同一天内存在重复的行程排序号");
        }

        if ("spot".equals(item.getItemType())) {
            if (item.getSpotId() == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "景点节点必须提供 spotId");
            }
            Spot spot = spotMap.get(item.getSpotId());
            if (spot == null || !request.getCityId().equals(spot.getCityId())
                    || !Integer.valueOf(1).equals(spot.getStatus())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "行程中包含无效景点或跨城市景点");
            }
            return;
        }

        if (item.getSpotId() != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "非景点节点不应绑定 spotId");
        }
    }

    /**
     * 路线段一旦参与落库，关键位置字段必须完整。
     */
    private void validateSegments(SaveTripRequest request) {
        if (request.getSegments() == null || request.getSegments().isEmpty()) {
            return;
        }
        if (request.getStartPosition() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "保存带路线分段的行程时必须提供起点坐标");
        }

        for (SaveTripRequest.RouteSegmentRequest segment : request.getSegments()) {
            if (segment.getDayIndex() == null || segment.getDayIndex() < 1
                    || segment.getDayIndex() > request.getDays()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "路线分段所属天数超出范围");
            }
            if (segment.getSegmentIndex() == null || segment.getSegmentIndex() < 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "路线分段序号不能为空");
            }
            if (!StringUtils.hasText(segment.getFromName()) || !StringUtils.hasText(segment.getToName())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "路线分段起终点名称不能为空");
            }
            if (segment.getFromPosition() == null || segment.getToPosition() == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "路线分段起终点坐标不能为空");
            }
            if (!StringUtils.hasText(segment.getTransportType())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "路线分段交通方式不能为空");
            }
        }
    }

    private boolean isSupportedItemType(String itemType) {
        return "spot".equals(itemType)
                || "lunch".equals(itemType)
                || "rest".equals(itemType)
                || "hotel".equals(itemType);
    }

    @Override
    public PageResponse<TripSummaryResponse> listUserTrips(Long userId, PageQuery pageQuery) {
        Page<UserTrip> page = userTripMapper.selectPage(
                new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()),
                new LambdaQueryWrapper<UserTrip>()
                        .eq(UserTrip::getUserId, userId)
                        .eq(UserTrip::getStatus, 1)
                        .orderByDesc(UserTrip::getCreatedAt));

        List<Long> cityIds = page.getRecords().stream().map(UserTrip::getCityId).distinct().toList();
        Map<Long, String> cityIdToName = cityMapper.selectBatchIds(cityIds).stream()
                .collect(Collectors.toMap(City::getId, City::getCityName));

        List<TripSummaryResponse> list = page.getRecords().stream().map(t -> new TripSummaryResponse(
                t.getId(),
                t.getCityId(),
                cityIdToName.getOrDefault(t.getCityId(), "未知城市"),
                t.getTripName(),
                t.getStartName(),
                t.getEndName(),
                t.getStartDate(),
                t.getEndDate(),
                t.getDays(),
                t.getTransportType(),
                t.getPlanMode(),
                t.getTotalDistance(),
                t.getTotalTripDuration(), // 列表展示总耗时
                t.getCoverUrl(),
                t.getCreatedAt())).toList();

        return PageResponse.paged(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public TripDetailResponse getTripDetail(Long userId, Long tripId) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId) || !Integer.valueOf(1).equals(trip.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        City city = cityMapper.selectById(trip.getCityId());
        List<UserTripItem> items = userTripItemMapper.selectList(
                new LambdaQueryWrapper<UserTripItem>()
                        .eq(UserTripItem::getTripId, tripId)
                        .orderByAsc(UserTripItem::getDayIndex, UserTripItem::getSortOrder));

        List<Long> spotIds = items.stream()
                .filter(i -> i.getSpotId() != null)
                .map(UserTripItem::getSpotId)
                .toList();

        Map<Long, Spot> spotMap = spotIds.isEmpty() ? Map.of()
                : spotMapper.selectBatchIds(spotIds).stream()
                        .collect(Collectors.toMap(Spot::getId, s -> s));

        // 按天分组
        Map<Integer, List<UserTripItem>> groupedItems = items.stream()
                .collect(Collectors.groupingBy(UserTripItem::getDayIndex));

        List<TripDetailResponse.TripDaySpotsResponse> itineraryDays = groupedItems.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<TripDetailResponse.TripSpotDetailResponse> daySpots = entry.getValue().stream()
                            .map(item -> {
                                Spot s = item.getSpotId() != null ? spotMap.get(item.getSpotId()) : null;
                                return new TripDetailResponse.TripSpotDetailResponse(
                                        item.getSpotId(),
                                        item.getItemName(),
                                        s != null ? s.getCoverUrl() : null,
                                        item.getSortOrder(),
                                        item.getSuggestedDuration());
                            }).toList();
                    List<TripDetailResponse.TripItemDetailResponse> dayItems = entry.getValue().stream()
                            .map(item -> {
                                Spot s = item.getSpotId() != null ? spotMap.get(item.getSpotId()) : null;
                                return new TripDetailResponse.TripItemDetailResponse(
                                        item.getSpotId(),
                                        item.getItemType(),
                                        item.getItemName(),
                                        s != null ? s.getCoverUrl() : null,
                                        item.getLng(),
                                        item.getLat(),
                                        item.getSortOrder(),
                                        item.getSuggestedDuration(),
                                        item.getStartTime(),
                                        item.getEndTime());
                            }).toList();
                    return new TripDetailResponse.TripDaySpotsResponse(entry.getKey(), daySpots, dayItems);
                }).toList();

        return new TripDetailResponse(
                trip.getId(),
                trip.getCityId(),
                city != null ? city.getCityName() : "未知城市",
                trip.getTripName(),
                trip.getStartName(),
                trip.getEndName(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getDays(),
                trip.getTransportType(),
                trip.getPlanMode(),
                trip.getTotalDistance(),
                trip.getTotalTripDuration(),
                trip.getRouteRecordId(),
                trip.getCoverUrl(),
                trip.getCreatedAt(),
                itineraryDays);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTrip(Long userId, Long tripId) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        trip.setStatus(0);
        trip.setUpdatedAt(LocalDateTime.now());
        userTripMapper.updateById(trip);
    }
}
