package com.trailmap.mapper;

import com.trailmap.model.response.UserProfileOverviewResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 个人主页聚合 Mapper，负责用户画像页的统计查询。
 */
@Mapper
public interface UserProfileMapper {

    /**
     * 查询个人主页概览统计，统一由数据库聚合，避免前端依赖分页数据自行计数。
     */
    UserProfileOverviewResponse selectUserProfileOverview(@Param("userId") Long userId);
}
