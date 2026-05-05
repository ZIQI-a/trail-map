package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.City;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.CityMapper;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CitySummaryResponse;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.CityService;
import java.util.Comparator;
import org.springframework.stereotype.Service;

/**
 * 城市服务实现，当前从内存数据源读取，后续可平滑替换成 Mapper 查询。
 */
@Service
public class CityServiceImpl implements CityService {

    private final CityMapper cityMapper;

    public CityServiceImpl(CityMapper cityMapper) {
        this.cityMapper = cityMapper;
    }

    @Override
    public PageResponse<CitySummaryResponse> listCities(PageQuery pageQuery) {
        LambdaQueryWrapper<City> queryWrapper = new LambdaQueryWrapper<City>()
                .eq(City::getStatus, 1)
                .orderByAsc(City::getSortOrder);

        if (!pageQuery.isPaged()) {
            return PageResponse.unpaged(cityMapper.selectList(queryWrapper).stream()
                    .sorted(Comparator.comparing(City::getSortOrder))
                    .map(this::toResponse)
                    .toList());
        }

        Page<City> page = cityMapper.selectPage(new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()), queryWrapper);
        return PageResponse.paged(page.getRecords().stream()
                .map(this::toResponse)
                .toList(), page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public CitySummaryResponse getCity(Long cityId) {
        City city = cityMapper.selectOne(new LambdaQueryWrapper<City>()
                .eq(City::getId, cityId)
                .eq(City::getStatus, 1));
        if (city == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "城市不存在或已下线");
        }
        return toResponse(city);
    }

    private CitySummaryResponse toResponse(City city) {
        return new CitySummaryResponse(
                city.getId(),
                city.getCityName(),
                city.getProvinceName(),
                city.getCityCode(),
                new CoordinateResponse(city.getCenterLng(), city.getCenterLat()),
                city.getMapZoom(),
                city.getCoverUrl(),
                city.getDescription(),
                city.getRecommendDays(),
                city.getHotScore()
        );
    }
}
