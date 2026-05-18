package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.UserFavoriteSpot;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户收藏景点 Mapper，负责收藏关系的基础读写。
 */
@Mapper
public interface UserFavoriteSpotMapper extends BaseMapper<UserFavoriteSpot> {
}
