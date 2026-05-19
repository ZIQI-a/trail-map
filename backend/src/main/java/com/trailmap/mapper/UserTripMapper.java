package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.UserTrip;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户行程 Mapper。
 */
@Mapper
public interface UserTripMapper extends BaseMapper<UserTrip> {
}
