package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.UserFavoriteSpot;
import com.trailmap.model.query.FavoriteSpotQuery;
import com.trailmap.model.response.FavoriteSpotBaseRecord;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户收藏景点 Mapper，负责收藏关系的基础读写。
 */
@Mapper
public interface UserFavoriteSpotMapper extends BaseMapper<UserFavoriteSpot> {

    List<FavoriteSpotBaseRecord> selectFavoriteSpotPage(
            @Param("userId") Long userId,
            @Param("query") FavoriteSpotQuery query,
            @Param("offset") long offset,
            @Param("limit") long limit);

    long countFavoriteSpots(
            @Param("userId") Long userId,
            @Param("query") FavoriteSpotQuery query);
}
