package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.RouteRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 路线记录 Mapper。
 */
@Mapper
public interface RouteRecordMapper extends BaseMapper<RouteRecord> {
}
