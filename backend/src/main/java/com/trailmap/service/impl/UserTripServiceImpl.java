package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
import com.trailmap.model.query.CoordinateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SaveTripRequest;
import com.trailmap.model.query.UserTripQuery;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.TripDetailResponse;
import com.trailmap.model.response.TripShareResponse;
import com.trailmap.model.response.TripSummaryBaseRecord;
import com.trailmap.model.response.TripSummaryResponse;
import com.trailmap.service.UserTripService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
        String routeFingerprint = buildRouteFingerprint(request);
        validateUniqueActiveRoute(userId, routeFingerprint);

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
        trip.setRouteFingerprint(routeFingerprint);
        trip.setTotalDistance(request.getTotalDistance() != null ? request.getTotalDistance() : 0);
        trip.setTotalTravelDuration(request.getTotalTravelDuration() != null ? request.getTotalTravelDuration() : 0);
        trip.setTotalStayDuration(request.getTotalStayDuration() != null ? request.getTotalStayDuration() : 0);
        trip.setTotalTripDuration(request.getTotalTripDuration() != null ? request.getTotalTripDuration() : 0);
        trip.setCoverUrl(request.getCoverUrl() != null ? request.getCoverUrl() : city.getCoverUrl());
        trip.setIsPublic(0);
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
     * 用户同一条有效路线只能保存一次，避免“我的行程”里出现重复记录。
     */
    private void validateUniqueActiveRoute(Long userId, String routeFingerprint) {
        Long duplicatedCount = userTripMapper.selectCount(
                new LambdaQueryWrapper<UserTrip>()
                        .eq(UserTrip::getUserId, userId)
                        .eq(UserTrip::getStatus, 1)
                        .eq(UserTrip::getRouteFingerprint, routeFingerprint));
        if (duplicatedCount != null && duplicatedCount > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该行程路线已保存，请勿重复保存");
        }
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

    /**
     * 根据路线核心内容生成稳定指纹；行程名不参与计算，允许用户后续自由重命名。
     */
    private String buildRouteFingerprint(SaveTripRequest request) {
        StringBuilder builder = new StringBuilder();
        builder.append("city=").append(request.getCityId())
                .append("|mode=").append(request.getPlanMode())
                .append("|transport=").append(request.getTransportType())
                .append("|days=").append(request.getDays())
                .append("|start=").append(normalizeText(request.getStartName()))
                .append("@").append(formatCoordinate(request.getStartPosition()))
                .append("|end=").append(normalizeText(request.getEndName()))
                .append("@").append(formatCoordinate(request.getEndPosition()));

        request.getItems().stream()
                .sorted((left, right) -> {
                    int dayCompare = left.getDayIndex().compareTo(right.getDayIndex());
                    return dayCompare != 0 ? dayCompare : left.getSortOrder().compareTo(right.getSortOrder());
                })
                .forEach(item -> builder.append("|item=")
                        .append(item.getDayIndex()).append(":")
                        .append(item.getSortOrder()).append(":")
                        .append(item.getItemType()).append(":")
                        .append(item.getSpotId() != null ? item.getSpotId() : normalizeText(item.getItemName()))
                        .append("@").append(formatCoordinate(item.getPosition()))
                        .append("#").append(nullToEmpty(item.getStartTime()))
                        .append("-").append(nullToEmpty(item.getEndTime())));

        if (request.getSegments() != null) {
            request.getSegments().stream()
                    .sorted((left, right) -> {
                        int dayCompare = left.getDayIndex().compareTo(right.getDayIndex());
                        return dayCompare != 0 ? dayCompare : left.getSegmentIndex().compareTo(right.getSegmentIndex());
                    })
                    .forEach(segment -> builder.append("|segment=")
                            .append(segment.getDayIndex()).append(":")
                            .append(segment.getSegmentIndex()).append(":")
                            .append(segment.getTransportType()).append(":")
                            .append(formatCoordinate(segment.getFromPosition()))
                            .append(">")
                            .append(formatCoordinate(segment.getToPosition()))
                            .append("#")
                            .append(segment.getDistance() != null ? segment.getDistance() : 0)
                            .append("/")
                            .append(segment.getDuration() != null ? segment.getDuration() : 0));
        }

        return sha256(builder.toString());
    }

    /**
     * 坐标统一保留 6 位小数，避免 BigDecimal scale 差异导致同一路线指纹不同。
     */
    private String formatCoordinate(CoordinateRequest coordinate) {
        if (coordinate == null) {
            return "";
        }
        return normalizeDecimal(coordinate.lng()) + "," + normalizeDecimal(coordinate.lat());
    }

    /**
     * 将坐标压到项目当前使用的 6 位精度。
     */
    private String normalizeDecimal(BigDecimal value) {
        if (value == null) {
            return "";
        }
        return value.setScale(6, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    /**
     * 文本参与指纹前先去掉首尾空白。
     */
    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    /**
     * 空值转空字符串，便于拼接稳定文本。
     */
    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    /**
     * 使用 SHA-256 生成固定长度路线指纹。
     */
    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "生成行程唯一标识失败");
        }
    }

    @Override
    public PageResponse<TripSummaryResponse> listUserTrips(Long userId, UserTripQuery query, PageQuery pageQuery) {
        validateTripListQuery(query);

        if (!pageQuery.isPaged()) {
            List<TripSummaryResponse> items = userTripMapper.selectUserTripPage(
                            userId,
                            query,
                            0,
                            Integer.MAX_VALUE)
                    .stream()
                    .map(this::toTripSummaryResponse)
                    .toList();
            return PageResponse.unpaged(items);
        }

        long total = userTripMapper.countUserTrips(userId, query);
        long offset = (pageQuery.resolvedPageNum() - 1) * pageQuery.resolvedPageSize();
        List<TripSummaryResponse> pagedItems = userTripMapper.selectUserTripPage(
                        userId,
                        query,
                        offset,
                        pageQuery.resolvedPageSize())
                .stream()
                .map(this::toTripSummaryResponse)
                .toList();
        return PageResponse.paged(pagedItems, total, pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize());
    }

    /**
     * 将 SQL 查询记录映射成前端行程列表响应。
     */
    private TripSummaryResponse toTripSummaryResponse(TripSummaryBaseRecord record) {
        return new TripSummaryResponse(
                record.id(),
                record.cityId(),
                record.cityName(),
                record.tripName(),
                record.startName(),
                record.endName(),
                record.startDate(),
                record.endDate(),
                record.days(),
                record.transportType(),
                record.planMode(),
                record.totalDistance(),
                record.totalDuration(),
                record.coverUrl(),
                record.isPublic() != null && record.isPublic() == 1,
                record.shareToken(),
                record.createdAt());
    }

    /**
     * 行程列表筛选值只允许当前产品约定的字段范围。
     */
    private void validateTripListQuery(UserTripQuery query) {
        if (query == null) {
            return;
        }
        if (StringUtils.hasText(query.planMode())
                && !"schedule".equals(query.planMode())
                && !"free".equals(query.planMode())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的行程类型筛选: " + query.planMode());
        }
        if (StringUtils.hasText(query.sortBy())
                && !"latest".equals(query.sortBy())
                && !"city".equals(query.sortBy())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的行程排序方式: " + query.sortBy());
        }
    }

    @Override
    public TripDetailResponse getTripDetail(Long userId, Long tripId) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId) || !Integer.valueOf(1).equals(trip.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        return buildTripDetailResponse(trip);
    }

    @Override
    public TripDetailResponse getPublicTripDetail(String shareToken) {
        if (!StringUtils.hasText(shareToken)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "分享链接无效");
        }
        UserTrip trip = userTripMapper.selectOne(
                new LambdaQueryWrapper<UserTrip>()
                        .eq(UserTrip::getShareToken, shareToken)
                        .eq(UserTrip::getIsPublic, 1)
                        .eq(UserTrip::getStatus, 1));
        if (trip == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "公开行程不存在或已关闭分享");
        }

        return buildTripDetailResponse(trip);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TripShareResponse updateTripShare(Long userId, Long tripId, boolean enabled) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId) || !Integer.valueOf(1).equals(trip.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        if (enabled) {
            trip.setIsPublic(1);
            if (!StringUtils.hasText(trip.getShareToken())) {
                trip.setShareToken(generateShareToken());
            }
            trip.setSharedAt(LocalDateTime.now());
        } else {
            trip.setIsPublic(0);
        }
        trip.setUpdatedAt(LocalDateTime.now());
        userTripMapper.updateById(trip);

        return new TripShareResponse(trip.getId(), isPublicTrip(trip), trip.getShareToken());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTripName(Long userId, Long tripId, String tripName) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId) || !Integer.valueOf(1).equals(trip.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }
        if (!StringUtils.hasText(tripName)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "行程名称不能为空");
        }

        trip.setTripName(tripName.trim());
        trip.setUpdatedAt(LocalDateTime.now());
        userTripMapper.updateById(trip);
    }

    /**
     * 组装行程详情响应，私有访问和公开分享访问复用同一套映射逻辑。
     */
    private TripDetailResponse buildTripDetailResponse(UserTrip trip) {
        Long tripId = trip.getId();
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

        // 加载路线分段用于地图还原
        List<TripDetailResponse.RouteSegmentResponse> routeSegments = List.of();
        if (trip.getRouteRecordId() != null) {
            routeSegments = routeSegmentMapper.selectList(
                    new LambdaQueryWrapper<RouteSegment>()
                            .eq(RouteSegment::getRouteRecordId, trip.getRouteRecordId())
                            .orderByAsc(RouteSegment::getDayIndex, RouteSegment::getSegmentIndex)
            ).stream().map(rs -> new TripDetailResponse.RouteSegmentResponse(
                    rs.getDayIndex(),
                    rs.getSegmentIndex(),
                    rs.getFromName(),
                    rs.getFromLng(),
                    rs.getFromLat(),
                    rs.getToName(),
                    rs.getToLng(),
                    rs.getToLat(),
                    rs.getTransportType(),
                    rs.getDistance(),
                    rs.getDuration(),
                    rs.getInstruction(),
                    rs.getPolyline(),
                    rs.getStepsJson()
            )).toList();
        }

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
                isPublicTrip(trip),
                trip.getShareToken(),
                trip.getCreatedAt(),
                itineraryDays,
                routeSegments
        );
    }

    /**
     * 生成公开分享令牌，使用无横线 UUID 降低被猜测概率。
     */
    private String generateShareToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 将数据库 tinyint 分享状态转换为前端布尔值。
     */
    private boolean isPublicTrip(UserTrip trip) {
        return Integer.valueOf(1).equals(trip.getIsPublic());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTrip(Long userId, Long tripId) {
        UserTrip trip = userTripMapper.selectById(tripId);
        if (trip == null || !trip.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "行程不存在或无权访问");
        }

        trip.setStatus(0);
        trip.setRouteFingerprint(null);
        trip.setUpdatedAt(LocalDateTime.now());
        userTripMapper.updateById(trip);
    }
}
