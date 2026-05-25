package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.UserTrip;
import com.trailmap.model.query.UserTripQuery;
import com.trailmap.model.response.TripSummaryBaseRecord;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户行程 Mapper。
 */
@Mapper
public interface UserTripMapper extends BaseMapper<UserTrip> {

    List<TripSummaryBaseRecord> selectUserTripPage(
            @Param("userId") Long userId,
            @Param("query") UserTripQuery query,
            @Param("offset") long offset,
            @Param("limit") long limit);

    long countUserTrips(
            @Param("userId") Long userId,
            @Param("query") UserTripQuery query);
}
