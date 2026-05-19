package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
import com.trailmap.model.response.SpotTagResponse;
import com.trailmap.service.TagService;
import java.util.Comparator;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * 标签服务实现，按城市实际关联到的景点标签返回，避免前端拿到无效筛选项。
 */
@Service
public class TagServiceImpl implements TagService {

    private final CityMapper cityMapper;
    private final SpotMapper spotMapper;
    private final SpotTagMapper spotTagMapper;
    private final SpotTagRelationMapper spotTagRelationMapper;

    public TagServiceImpl(
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
    public java.util.List<SpotTagResponse> listTagsByCity(Long cityId) {
        validateCity(cityId);
        Set<Long> spotIds = spotMapper.selectList(new LambdaQueryWrapper<Spot>()
                        .eq(Spot::getCityId, cityId)
                        .eq(Spot::getStatus, 1))
                .stream()
                .map(Spot::getId)
                .collect(Collectors.toSet());

        Set<Long> tagIds = spotTagRelationMapper.selectList(new LambdaQueryWrapper<SpotTagRelation>()
                        .in(!spotIds.isEmpty(), SpotTagRelation::getSpotId, spotIds))
                .stream()
                .map(SpotTagRelation::getTagId)
                .collect(Collectors.toSet());

        if (tagIds.isEmpty()) {
            return java.util.List.of();
        }

        return spotTagMapper.selectList(new LambdaQueryWrapper<SpotTag>()
                        .eq(SpotTag::getStatus, 1)
                        .in(SpotTag::getId, tagIds))
                .stream()
                .sorted(Comparator.comparing(SpotTag::getSortOrder))
                .map(tag -> new SpotTagResponse(tag.getId(), tag.getTagName(), tag.getTagCode(), tag.getTagType(), tag.getSortOrder()))
                .toList();
    }

    @Override
    public java.util.List<SpotTagResponse> listAllTags() {
        return spotTagMapper.selectList(new LambdaQueryWrapper<SpotTag>()
                        .eq(SpotTag::getStatus, 1))
                .stream()
                .sorted(Comparator.comparing(SpotTag::getSortOrder))
                .map(tag -> new SpotTagResponse(tag.getId(), tag.getTagName(), tag.getTagCode(), tag.getTagType(), tag.getSortOrder()))
                .toList();
    }

    private void validateCity(Long cityId) {
        Long count = cityMapper.selectCount(new LambdaQueryWrapper<City>()
                .eq(City::getId, cityId)
                .eq(City::getStatus, 1));
        if (count == null || count == 0L) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "城市不存在或已下线");
        }
    }
}
