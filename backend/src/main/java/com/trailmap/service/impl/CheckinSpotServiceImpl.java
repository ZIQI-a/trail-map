package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.SpotTag;
import com.trailmap.entity.SpotTagRelation;
import com.trailmap.entity.UserCheckinSpot;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.mapper.SpotTagMapper;
import com.trailmap.mapper.SpotTagRelationMapper;
import com.trailmap.mapper.UserCheckinSpotMapper;
import com.trailmap.model.query.CheckinSpotQuery;
import com.trailmap.model.query.CheckinSpotRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CheckinSpotBaseRecord;
import com.trailmap.model.response.CheckinSpotItemResponse;
import com.trailmap.model.response.CheckinSpotStatusResponse;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.SpotTagResponse;
import com.trailmap.service.CheckinSpotService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 打卡景点服务实现，只记录当前用户主动去过的景点，不做定位考勤式校验。
 */
@Service
public class CheckinSpotServiceImpl implements CheckinSpotService {

    private final SpotMapper spotMapper;
    private final SpotTagMapper spotTagMapper;
    private final SpotTagRelationMapper spotTagRelationMapper;
    private final UserCheckinSpotMapper userCheckinSpotMapper;

    public CheckinSpotServiceImpl(
            SpotMapper spotMapper,
            SpotTagMapper spotTagMapper,
            SpotTagRelationMapper spotTagRelationMapper,
            UserCheckinSpotMapper userCheckinSpotMapper) {
        this.spotMapper = spotMapper;
        this.spotTagMapper = spotTagMapper;
        this.spotTagRelationMapper = spotTagRelationMapper;
        this.userCheckinSpotMapper = userCheckinSpotMapper;
    }

    @Override
    public PageResponse<CheckinSpotItemResponse> listCheckinSpots(Long userId, CheckinSpotQuery query, PageQuery pageQuery) {
        Map<Long, List<SpotTagResponse>> tagMapping = buildSpotTagMapping();
        validateSortBy(query.sortBy());
        LocalDateTime checkedInAfter = query.checkedInWithinDays() == null
                ? null
                : LocalDateTime.now().minusDays(query.checkedInWithinDays());

        if (!pageQuery.isPaged()) {
            List<CheckinSpotItemResponse> items = userCheckinSpotMapper.selectCheckinSpotPage(
                            userId,
                            query,
                            checkedInAfter,
                            0,
                            Integer.MAX_VALUE)
                    .stream()
                    .map(record -> toCheckinItemResponse(record, tagMapping))
                    .toList();
            return PageResponse.unpaged(items);
        }

        long total = userCheckinSpotMapper.countCheckinSpots(userId, query, checkedInAfter);
        long offset = (pageQuery.resolvedPageNum() - 1) * pageQuery.resolvedPageSize();
        List<CheckinSpotItemResponse> pagedItems = userCheckinSpotMapper.selectCheckinSpotPage(
                        userId,
                        query,
                        checkedInAfter,
                        offset,
                        pageQuery.resolvedPageSize())
                .stream()
                .map(record -> toCheckinItemResponse(record, tagMapping))
                .toList();
        return PageResponse.paged(pagedItems, total, pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize());
    }

    @Override
    public CheckinSpotStatusResponse getCheckinStatus(Long userId, Long spotId) {
        validateSpotAvailable(spotId);
        UserCheckinSpot checkinSpot = findCheckinSpot(userId, spotId);
        return toStatusResponse(checkinSpot);
    }

    @Override
    public CheckinSpotStatusResponse checkinSpot(Long userId, Long spotId, CheckinSpotRequest request) {
        validateSpotAvailable(spotId);
        UserCheckinSpot checkinSpot = findCheckinSpot(userId, spotId);
        LocalDateTime now = LocalDateTime.now();

        if (checkinSpot == null) {
            checkinSpot = new UserCheckinSpot();
            checkinSpot.setUserId(userId);
            checkinSpot.setSpotId(spotId);
            checkinSpot.setCheckinTime(now);
            checkinSpot.setCreatedAt(now);
        }

        // 重复打卡按更新备注和坐标处理，避免唯一约束下产生重复足迹。
        checkinSpot.setCheckinLng(request.checkinLng());
        checkinSpot.setCheckinLat(request.checkinLat());
        checkinSpot.setRemark(normalizeRemark(request.remark()));
        if (checkinSpot.getId() == null) {
            userCheckinSpotMapper.insert(checkinSpot);
        } else {
            updateExistingCheckin(checkinSpot);
        }
        return toStatusResponse(checkinSpot);
    }

    @Override
    public CheckinSpotStatusResponse uncheckinSpot(Long userId, Long spotId) {
        validateSpotAvailable(spotId);
        userCheckinSpotMapper.delete(new LambdaUpdateWrapper<UserCheckinSpot>()
                .eq(UserCheckinSpot::getUserId, userId)
                .eq(UserCheckinSpot::getSpotId, spotId));
        return new CheckinSpotStatusResponse(false, null, null);
    }

    private UserCheckinSpot findCheckinSpot(Long userId, Long spotId) {
        return userCheckinSpotMapper.selectOne(new LambdaQueryWrapper<UserCheckinSpot>()
                .eq(UserCheckinSpot::getUserId, userId)
                .eq(UserCheckinSpot::getSpotId, spotId)
                .last("LIMIT 1"));
    }

    private CheckinSpotStatusResponse toStatusResponse(UserCheckinSpot checkinSpot) {
        if (checkinSpot == null) {
            return new CheckinSpotStatusResponse(false, null, null);
        }
        return new CheckinSpotStatusResponse(true, checkinSpot.getCheckinTime(), checkinSpot.getRemark());
    }

    private void updateExistingCheckin(UserCheckinSpot checkinSpot) {
        userCheckinSpotMapper.update(new LambdaUpdateWrapper<UserCheckinSpot>()
                .eq(UserCheckinSpot::getId, checkinSpot.getId())
                .set(UserCheckinSpot::getCheckinLng, checkinSpot.getCheckinLng())
                .set(UserCheckinSpot::getCheckinLat, checkinSpot.getCheckinLat())
                .set(UserCheckinSpot::getRemark, checkinSpot.getRemark()));
    }

    private CheckinSpotItemResponse toCheckinItemResponse(
            CheckinSpotBaseRecord record,
            Map<Long, List<SpotTagResponse>> tagMapping) {
        return new CheckinSpotItemResponse(
                record.checkinId(),
                record.spotId(),
                record.cityId(),
                record.cityName(),
                record.name(),
                record.type(),
                new CoordinateResponse(record.lng(), record.lat()),
                record.address(),
                record.coverUrl(),
                record.summary(),
                record.recommendReason(),
                record.openingHours(),
                record.ticketInfo(),
                record.suggestedDurationMinutes(),
                record.bestTime(),
                record.recommendScore(),
                record.hotScore(),
                toBoolean(record.isFree()),
                toBoolean(record.isIndoor()),
                toBoolean(record.isNight()),
                toBoolean(record.isRainyDay()),
                toBoolean(record.subwayFriendly()),
                toBoolean(record.firstVisit()),
                record.checkedInAt(),
                toCheckinPosition(record.checkinLng(), record.checkinLat()),
                record.remark(),
                sortTags(tagMapping.getOrDefault(record.spotId(), List.of()))
        );
    }

    private CoordinateResponse toCheckinPosition(BigDecimal lng, BigDecimal lat) {
        if (lng == null || lat == null) {
            return null;
        }
        return new CoordinateResponse(lng, lat);
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

    private void validateSortBy(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            return;
        }
        if (!"latest".equals(sortBy) && !"score".equals(sortBy)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的打卡排序方式: " + sortBy);
        }
    }

    // 打卡只允许针对当前可见景点执行，避免历史或下线景点被继续写入新足迹。
    private void validateSpotAvailable(Long spotId) {
        Long count = spotMapper.selectCount(new LambdaQueryWrapper<com.trailmap.entity.Spot>()
                .eq(com.trailmap.entity.Spot::getId, spotId)
                .eq(com.trailmap.entity.Spot::getStatus, 1));
        if (count == null || count == 0L) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "景点不存在或已下线");
        }
    }

    private String normalizeRemark(String remark) {
        return StringUtils.hasText(remark) ? remark.trim() : null;
    }

    private boolean toBoolean(Integer value) {
        return value != null && value == 1;
    }
}
