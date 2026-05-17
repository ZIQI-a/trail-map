package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.entity.Spot;
import com.trailmap.enums.SpotType;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.model.query.AdminSpotCreateRequest;
import com.trailmap.model.query.AdminSpotUpdateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.AdminSpotResponse;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.AdminSpotService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 管理端景点服务实现，负责景点资料维护和后台筛选。
 */
@Service
public class AdminSpotServiceImpl implements AdminSpotService {

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;

    public AdminSpotServiceImpl(CityMapper cityMapper, SpotMapper spotMapper) {
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
    }

    @Override
    public PageResponse<AdminSpotResponse> listSpots(PageQuery pageQuery, Long cityId, String keyword, String type, Integer status) {
        validateType(type);
        Map<Long, String> cityNameMap = cityMapper.selectList(new LambdaQueryWrapper<City>()
                        .select(City::getId, City::getCityName))
                .stream()
                .collect(Collectors.toMap(City::getId, City::getCityName, (left, right) -> left));

        LambdaQueryWrapper<Spot> queryWrapper = new LambdaQueryWrapper<Spot>()
                .orderByAsc(Spot::getSortOrder)
                .orderByAsc(Spot::getId);
        if (cityId != null) {
            queryWrapper.eq(Spot::getCityId, cityId);
        }
        if (status != null) {
            queryWrapper.eq(Spot::getStatus, status);
        }
        if (StringUtils.hasText(type)) {
            queryWrapper.eq(Spot::getSpotType, type.trim());
        }
        if (StringUtils.hasText(keyword)) {
            String normalizedKeyword = keyword.trim();
            queryWrapper.and(wrapper -> wrapper
                    .like(Spot::getSpotName, normalizedKeyword)
                    .or()
                    .like(Spot::getSummary, normalizedKeyword)
                    .or()
                    .like(Spot::getAddress, normalizedKeyword));
        }

        if (!pageQuery.isPaged()) {
            return PageResponse.unpaged(spotMapper.selectList(queryWrapper).stream()
                    .sorted(Comparator.comparing(Spot::getSortOrder, Comparator.nullsLast(Integer::compareTo))
                            .thenComparing(Spot::getId))
                    .map(spot -> toResponse(spot, cityNameMap.get(spot.getCityId())))
                    .toList());
        }

        Page<Spot> page = spotMapper.selectPage(new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()), queryWrapper);
        return PageResponse.paged(page.getRecords().stream()
                .map(spot -> toResponse(spot, cityNameMap.get(spot.getCityId())))
                .toList(), page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public AdminSpotResponse getSpot(Long spotId) {
        Spot spot = loadSpot(spotId);
        City city = loadCity(spot.getCityId());
        return toResponse(spot, city.getCityName());
    }

    @Override
    public AdminSpotResponse createSpot(AdminSpotCreateRequest request) {
        validateType(request.spotType());
        City city = loadCity(request.cityId());

        LocalDateTime now = LocalDateTime.now();
        Spot spot = new Spot();
        spot.setId(nextSpotId());
        spot.setCityId(request.cityId());
        spot.setSpotName(request.spotName().trim());
        spot.setSpotType(request.spotType().trim());
        spot.setLng(request.lng());
        spot.setLat(request.lat());
        spot.setAddress(request.address().trim());
        spot.setAmapPoiId(normalizeBlank(request.amapPoiId()));
        spot.setBoundaryGeojson(normalizeBlank(request.boundaryGeojson()));
        spot.setCoverUrl(normalizeBlank(request.coverUrl()));
        spot.setSummary(normalizeBlank(request.summary()));
        spot.setDescription(normalizeBlank(request.description()));
        spot.setRecommendReason(normalizeBlank(request.recommendReason()));
        spot.setTravelGuide(normalizeBlank(request.travelGuide()));
        spot.setOpeningHours(normalizeBlank(request.openingHours()));
        spot.setTicketInfo(normalizeBlank(request.ticketInfo()));
        spot.setSuggestedDuration(request.suggestedDuration());
        spot.setBestTime(normalizeBlank(request.bestTime()));
        spot.setRecommendScore(request.recommendScore());
        spot.setHotScore(defaultInteger(request.hotScore()));
        spot.setSuitableCrowd(normalizeBlank(request.suitableCrowd()));
        spot.setIsFree(normalizeFlag(request.isFree()));
        spot.setIsIndoor(normalizeFlag(request.isIndoor()));
        spot.setIsNight(normalizeFlag(request.isNight()));
        spot.setIsRainyDay(normalizeFlag(request.isRainyDay()));
        spot.setSubwayFriendly(normalizeFlag(request.subwayFriendly()));
        spot.setFirstVisit(normalizeFlag(request.firstVisit()));
        spot.setSortOrder(defaultInteger(request.sortOrder()));
        spot.setStatus(request.status() == null ? 1 : request.status());
        spot.setCreatedAt(now);
        spot.setUpdatedAt(now);
        spotMapper.insert(spot);
        return toResponse(spot, city.getCityName());
    }

    @Override
    public AdminSpotResponse updateSpot(Long spotId, AdminSpotUpdateRequest request) {
        Spot spot = loadSpot(spotId);

        if (request.cityId() != null) {
            loadCity(request.cityId());
            spot.setCityId(request.cityId());
        }
        if (StringUtils.hasText(request.spotName())) {
            spot.setSpotName(request.spotName().trim());
        }
        if (StringUtils.hasText(request.spotType())) {
            validateType(request.spotType());
            spot.setSpotType(request.spotType().trim());
        }
        if (request.lng() != null) {
            spot.setLng(request.lng());
        }
        if (request.lat() != null) {
            spot.setLat(request.lat());
        }
        if (request.address() != null) {
            spot.setAddress(normalizeBlank(request.address()));
        }
        if (request.amapPoiId() != null) {
            spot.setAmapPoiId(normalizeBlank(request.amapPoiId()));
        }
        if (request.boundaryGeojson() != null) {
            spot.setBoundaryGeojson(normalizeBlank(request.boundaryGeojson()));
        }
        if (request.coverUrl() != null) {
            spot.setCoverUrl(normalizeBlank(request.coverUrl()));
        }
        if (request.summary() != null) {
            spot.setSummary(normalizeBlank(request.summary()));
        }
        if (request.description() != null) {
            spot.setDescription(normalizeBlank(request.description()));
        }
        if (request.recommendReason() != null) {
            spot.setRecommendReason(normalizeBlank(request.recommendReason()));
        }
        if (request.travelGuide() != null) {
            spot.setTravelGuide(normalizeBlank(request.travelGuide()));
        }
        if (request.openingHours() != null) {
            spot.setOpeningHours(normalizeBlank(request.openingHours()));
        }
        if (request.ticketInfo() != null) {
            spot.setTicketInfo(normalizeBlank(request.ticketInfo()));
        }
        if (request.suggestedDuration() != null) {
            spot.setSuggestedDuration(request.suggestedDuration());
        }
        if (request.bestTime() != null) {
            spot.setBestTime(normalizeBlank(request.bestTime()));
        }
        if (request.recommendScore() != null) {
            spot.setRecommendScore(request.recommendScore());
        }
        if (request.hotScore() != null) {
            spot.setHotScore(request.hotScore());
        }
        if (request.suitableCrowd() != null) {
            spot.setSuitableCrowd(normalizeBlank(request.suitableCrowd()));
        }
        if (request.isFree() != null) {
            spot.setIsFree(normalizeFlag(request.isFree()));
        }
        if (request.isIndoor() != null) {
            spot.setIsIndoor(normalizeFlag(request.isIndoor()));
        }
        if (request.isNight() != null) {
            spot.setIsNight(normalizeFlag(request.isNight()));
        }
        if (request.isRainyDay() != null) {
            spot.setIsRainyDay(normalizeFlag(request.isRainyDay()));
        }
        if (request.subwayFriendly() != null) {
            spot.setSubwayFriendly(normalizeFlag(request.subwayFriendly()));
        }
        if (request.firstVisit() != null) {
            spot.setFirstVisit(normalizeFlag(request.firstVisit()));
        }
        if (request.sortOrder() != null) {
            spot.setSortOrder(request.sortOrder());
        }
        if (request.status() != null) {
            spot.setStatus(request.status());
        }
        spot.setUpdatedAt(LocalDateTime.now());
        spotMapper.updateById(spot);

        City city = loadCity(spot.getCityId());
        return toResponse(spot, city.getCityName());
    }

    @Override
    public void deleteSpot(Long spotId) {
        loadSpot(spotId);
        spotMapper.deleteById(spotId);
    }

    private Spot loadSpot(Long spotId) {
        Spot spot = spotMapper.selectById(spotId);
        if (spot == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "景点不存在");
        }
        return spot;
    }

    private City loadCity(Long cityId) {
        City city = cityMapper.selectById(cityId);
        if (city == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "所属城市不存在");
        }
        return city;
    }

    private void validateType(String type) {
        if (StringUtils.hasText(type) && !SpotType.supports(type.trim())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的景点类型: " + type);
        }
    }

    private Integer normalizeFlag(Integer value) {
        return value != null && value == 1 ? 1 : 0;
    }

    private Integer defaultInteger(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private Long nextSpotId() {
        return spotMapper.selectList(new LambdaQueryWrapper<Spot>()
                        .select(Spot::getId)
                        .orderByDesc(Spot::getId)
                        .last("limit 1"))
                .stream()
                .map(Spot::getId)
                .findFirst()
                .orElse(0L) + 1;
    }

    private AdminSpotResponse toResponse(Spot spot, String cityName) {
        return new AdminSpotResponse(
                spot.getId(),
                spot.getCityId(),
                cityName,
                spot.getSpotName(),
                spot.getSpotType(),
                new CoordinateResponse(spot.getLng(), spot.getLat()),
                spot.getAddress(),
                spot.getAmapPoiId(),
                spot.getBoundaryGeojson(),
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
                spot.getIsFree() != null && spot.getIsFree() == 1,
                spot.getIsIndoor() != null && spot.getIsIndoor() == 1,
                spot.getIsNight() != null && spot.getIsNight() == 1,
                spot.getIsRainyDay() != null && spot.getIsRainyDay() == 1,
                spot.getSubwayFriendly() != null && spot.getSubwayFriendly() == 1,
                spot.getFirstVisit() != null && spot.getFirstVisit() == 1,
                spot.getSortOrder(),
                spot.getStatus(),
                spot.getCreatedAt(),
                spot.getUpdatedAt()
        );
    }
}
