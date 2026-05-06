package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.entity.Spot;
import com.trailmap.entity.SpotTag;
import com.trailmap.entity.SpotTagRelation;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.mapper.SpotTagMapper;
import com.trailmap.mapper.SpotTagRelationMapper;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SpotQuery;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.SpotDetailResponse;
import com.trailmap.model.response.SpotSummaryResponse;
import com.trailmap.model.response.SpotTagResponse;
import com.trailmap.service.SpotService;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 景点服务实现，负责把数据库风格实体转换成前端更易消费的响应结构。
 */
@Service
public class SpotServiceImpl implements SpotService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;
    private final SpotTagMapper spotTagMapper;
    private final SpotTagRelationMapper spotTagRelationMapper;

    public SpotServiceImpl(
            CityMapper cityMapper,
            SpotMapper spotMapper,
            SpotTagMapper spotTagMapper,
            SpotTagRelationMapper spotTagRelationMapper
    ) {
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
        this.spotTagMapper = spotTagMapper;
        this.spotTagRelationMapper = spotTagRelationMapper;
    }

    @Override
    public PageResponse<SpotSummaryResponse> listSpotsByCity(Long cityId, SpotQuery query, PageQuery pageQuery) {
        validateCity(cityId);
        validateType(query.type());
        Map<Long, List<SpotTagResponse>> tagMapping = buildSpotTagMapping();
        LambdaQueryWrapper<Spot> queryWrapper = new LambdaQueryWrapper<Spot>()
                .eq(Spot::getCityId, cityId)
                .eq(Spot::getStatus, 1)
                .orderByAsc(Spot::getSortOrder);

        if (!pageQuery.isPaged()) {
            return PageResponse.unpaged(spotMapper.selectList(queryWrapper)
                    .stream()
                    .filter(spot -> matchesKeyword(spot, query.keyword()))
                    .filter(spot -> matchesType(spot, query.type()))
                    .filter(spot -> matchesTag(spot.getId(), tagMapping, query.tagCode()))
                    .sorted(Comparator.comparing(Spot::getSortOrder))
                    .map(spot -> toSummaryResponse(spot, tagMapping.getOrDefault(spot.getId(), List.of())))
                    .toList());
        }

        Page<Spot> page = spotMapper.selectPage(new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()), queryWrapper);
        List<SpotSummaryResponse> records = page.getRecords()
                .stream()
                .filter(spot -> matchesKeyword(spot, query.keyword()))
                .filter(spot -> matchesType(spot, query.type()))
                .filter(spot -> matchesTag(spot.getId(), tagMapping, query.tagCode()))
                .sorted(Comparator.comparing(Spot::getSortOrder))
                .map(spot -> toSummaryResponse(spot, tagMapping.getOrDefault(spot.getId(), List.of())))
                .toList();
        return PageResponse.paged(records, page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public SpotDetailResponse getSpot(Long spotId) {
        Map<Long, List<SpotTagResponse>> tagMapping = buildSpotTagMapping();
        Spot spot = spotMapper.selectOne(new LambdaQueryWrapper<Spot>()
                .eq(Spot::getId, spotId)
                .eq(Spot::getStatus, 1));
        if (spot == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "景点不存在或已下线");
        }
        return toDetailResponse(spot, tagMapping.getOrDefault(spot.getId(), List.of()));
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

    private SpotSummaryResponse toSummaryResponse(Spot spot, List<SpotTagResponse> tags) {
        return new SpotSummaryResponse(
                spot.getId(),
                spot.getCityId(),
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
                sortTags(tags)
        );
    }

    private SpotDetailResponse toDetailResponse(Spot spot, List<SpotTagResponse> tags) {
        return new SpotDetailResponse(
                spot.getId(),
                spot.getCityId(),
                spot.getSpotName(),
                spot.getSpotType(),
                new CoordinateResponse(spot.getLng(), spot.getLat()),
                spot.getAddress(),
                spot.getAmapPoiId(),
                parseBoundary(spot.getBoundaryGeojson()),
                spot.getCoverUrl(),
                spot.getSummary(),
                spot.getDescription(),
                spot.getRecommendReason(),
                spot.getTravelGuide(),
                spot.getOpeningHours(),
                spot.getTicketInfo(),
                spot.getSuggestedDuration(),
                spot.getBestTime(),
                spot.getRecommendScore(),
                spot.getHotScore(),
                spot.getSuitableCrowd(),
                toBoolean(spot.getIsFree()),
                toBoolean(spot.getIsIndoor()),
                toBoolean(spot.getIsNight()),
                toBoolean(spot.getIsRainyDay()),
                toBoolean(spot.getSubwayFriendly()),
                toBoolean(spot.getFirstVisit()),
                sortTags(tags)
        );
    }

    private List<SpotTagResponse> sortTags(List<SpotTagResponse> tags) {
        return tags.stream()
                .sorted(Comparator.comparing(SpotTagResponse::sortOrder))
                .toList();
    }

    private boolean matchesKeyword(Spot spot, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        String normalizedKeyword = keyword.trim().toLowerCase(Locale.ROOT);
        return spot.getSpotName().toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                || spot.getSummary().toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                || spot.getAddress().toLowerCase(Locale.ROOT).contains(normalizedKeyword);
    }

    private boolean matchesType(Spot spot, String type) {
        return !StringUtils.hasText(type) || spot.getSpotType().equals(type);
    }

    private boolean matchesTag(Long spotId, Map<Long, List<SpotTagResponse>> tagMapping, String tagCode) {
        if (!StringUtils.hasText(tagCode)) {
            return true;
        }
        Set<String> codes = tagMapping.getOrDefault(spotId, List.of()).stream()
                .map(SpotTagResponse::code)
                .collect(Collectors.toSet());
        return codes.contains(tagCode);
    }

    private void validateCity(Long cityId) {
        Long count = cityMapper.selectCount(new LambdaQueryWrapper<City>()
                .eq(City::getId, cityId)
                .eq(City::getStatus, 1));
        if (count == null || count == 0L) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "城市不存在或已下线");
        }
    }

    private void validateType(String type) {
        if (StringUtils.hasText(type) && !com.trailmap.enums.SpotType.supports(type)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的景点类型: " + type);
        }
    }

    private boolean toBoolean(Integer value) {
        return value != null && value == 1;
    }

    // 解析景点边界 GeoJSON，当前只消费 Polygon 的第一条外环，方便前端直接绘制轮廓。
    private List<CoordinateResponse> parseBoundary(String boundaryGeojson) {
        if (!StringUtils.hasText(boundaryGeojson)) {
            return List.of();
        }

        try {
            JsonNode root = OBJECT_MAPPER.readTree(boundaryGeojson);
            JsonNode coordinates = root.path("coordinates");
            if (!"Polygon".equals(root.path("type").asText()) || !coordinates.isArray() || coordinates.isEmpty()) {
                return List.of();
            }

            JsonNode outerRing = coordinates.get(0);
            if (!outerRing.isArray()) {
                return List.of();
            }

            return java.util.stream.StreamSupport.stream(outerRing.spliterator(), false)
                    .filter(JsonNode::isArray)
                    .filter(point -> point.size() >= 2)
                    .map(point -> new CoordinateResponse(
                            new java.math.BigDecimal(point.get(0).asText()),
                            new java.math.BigDecimal(point.get(1).asText())
                    ))
                    .toList();
        } catch (Exception exception) {
            return List.of();
        }
    }
}
