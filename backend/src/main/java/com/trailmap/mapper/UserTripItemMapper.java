package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.UserTripItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户行程子项目 Mapper。
 */
@Mapper
public interface UserTripItemMapper extends BaseMapper<UserTripItem> {
}
