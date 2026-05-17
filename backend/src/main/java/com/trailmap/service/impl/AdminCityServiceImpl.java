package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.mapper.SpotMapper;
import com.trailmap.model.query.AdminCityCreateRequest;
import com.trailmap.model.query.AdminCityUpdateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.AdminCityResponse;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.AdminCityService;
import java.time.LocalDateTime;
import java.util.Comparator;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 管理端城市服务实现，负责城市资料维护和基础校验。
 */
@Service
public class AdminCityServiceImpl implements AdminCityService {

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;

    public AdminCityServiceImpl(CityMapper cityMapper, SpotMapper spotMapper) {
        this.cityMapper = cityMapper;
        this.spotMapper = spotMapper;
    }

    @Override
    public PageResponse<AdminCityResponse> listCities(PageQuery pageQuery) {
        LambdaQueryWrapper<City> queryWrapper = new LambdaQueryWrapper<City>()
                .orderByAsc(City::getSortOrder)
                .orderByAsc(City::getId);

        if (!pageQuery.isPaged()) {
            return PageResponse.unpaged(cityMapper.selectList(queryWrapper).stream()
                    .sorted(Comparator.comparing(City::getSortOrder, Comparator.nullsLast(Integer::compareTo))
                            .thenComparing(City::getId))
                    .map(this::toResponse)
                    .toList());
        }

        Page<City> page = cityMapper.selectPage(new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()), queryWrapper);
        return PageResponse.paged(page.getRecords().stream()
                .map(this::toResponse)
                .toList(), page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public AdminCityResponse getCity(Long cityId) {
        return toResponse(loadCity(cityId));
    }

    @Override
    public AdminCityResponse createCity(AdminCityCreateRequest request) {
        validateCityCodeUnique(null, request.cityCode());

        LocalDateTime now = LocalDateTime.now();
        City city = new City();
        city.setId(nextCityId());
        city.setCityName(request.cityName().trim());
        city.setProvinceName(request.provinceName().trim());
        city.setCityCode(request.cityCode().trim());
        city.setCenterLng(request.centerLng());
        city.setCenterLat(request.centerLat());
        city.setMapZoom(request.mapZoom());
        city.setCoverUrl(normalizeBlank(request.coverUrl()));
        city.setDescription(normalizeBlank(request.description()));
        city.setRecommendDays(request.recommendDays());
        city.setHotScore(defaultInteger(request.hotScore()));
        city.setSortOrder(defaultInteger(request.sortOrder()));
        city.setStatus(request.status() == null ? 1 : request.status());
        city.setCreatedAt(now);
        city.setUpdatedAt(now);
        cityMapper.insert(city);
        return toResponse(city);
    }

    @Override
    public AdminCityResponse updateCity(Long cityId, AdminCityUpdateRequest request) {
        City city = loadCity(cityId);

        if (StringUtils.hasText(request.cityName())) {
            city.setCityName(request.cityName().trim());
        }
        if (StringUtils.hasText(request.provinceName())) {
            city.setProvinceName(request.provinceName().trim());
        }
        if (StringUtils.hasText(request.cityCode())) {
            validateCityCodeUnique(cityId, request.cityCode());
            city.setCityCode(request.cityCode().trim());
        }
        if (request.centerLng() != null) {
            city.setCenterLng(request.centerLng());
        }
        if (request.centerLat() != null) {
            city.setCenterLat(request.centerLat());
        }
        if (request.mapZoom() != null) {
            city.setMapZoom(request.mapZoom());
        }
        if (request.coverUrl() != null) {
            city.setCoverUrl(normalizeBlank(request.coverUrl()));
        }
        if (request.description() != null) {
            city.setDescription(normalizeBlank(request.description()));
        }
        if (request.recommendDays() != null) {
            city.setRecommendDays(request.recommendDays());
        }
        if (request.hotScore() != null) {
            city.setHotScore(request.hotScore());
        }
        if (request.sortOrder() != null) {
            city.setSortOrder(request.sortOrder());
        }
        if (request.status() != null) {
            city.setStatus(request.status());
        }
        city.setUpdatedAt(LocalDateTime.now());
        cityMapper.updateById(city);
        return toResponse(city);
    }

    @Override
    public void deleteCity(Long cityId) {
        City city = loadCity(cityId);
        Long relatedSpotCount = spotMapper.selectCount(new LambdaQueryWrapper<com.trailmap.entity.Spot>()
                .eq(com.trailmap.entity.Spot::getCityId, cityId));
        if (relatedSpotCount != null && relatedSpotCount > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该城市下仍有关联景点，不能直接删除");
        }
        cityMapper.deleteById(cityId);
    }

    private City loadCity(Long cityId) {
        City city = cityMapper.selectById(cityId);
        if (city == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "城市不存在");
        }
        return city;
    }

    private void validateCityCodeUnique(Long currentCityId, String cityCode) {
        String normalizedCode = cityCode.trim();
        LambdaQueryWrapper<City> queryWrapper = new LambdaQueryWrapper<City>()
                .eq(City::getCityCode, normalizedCode);
        if (currentCityId != null) {
            queryWrapper.ne(City::getId, currentCityId);
        }
        if (cityMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "城市编码已存在");
        }
    }

    private Long nextCityId() {
        Long maxId = cityMapper.selectList(new LambdaQueryWrapper<City>()
                        .select(City::getId)
                        .orderByDesc(City::getId)
                        .last("limit 1"))
                .stream()
                .map(City::getId)
                .findFirst()
                .orElse(0L);
        return maxId + 1;
    }

    private Integer defaultInteger(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private AdminCityResponse toResponse(City city) {
        return new AdminCityResponse(
                city.getId(),
                city.getCityName(),
                city.getProvinceName(),
                city.getCityCode(),
                new CoordinateResponse(city.getCenterLng(), city.getCenterLat()),
                city.getMapZoom(),
                city.getCoverUrl(),
                city.getDescription(),
                city.getRecommendDays(),
                city.getHotScore(),
                city.getSortOrder(),
                city.getStatus()
        );
    }
}
