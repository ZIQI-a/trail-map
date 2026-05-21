package com.trailmap.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.trailmap.entity.UserCheckinSpot;
import com.trailmap.model.query.CheckinSpotQuery;
import com.trailmap.model.response.CheckinSpotBaseRecord;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户打卡景点 Mapper，负责打卡关系和足迹列表查询。
 */
@Mapper
public interface UserCheckinSpotMapper extends BaseMapper<UserCheckinSpot> {

    List<CheckinSpotBaseRecord> selectCheckinSpotPage(
            @Param("userId") Long userId,
            @Param("query") CheckinSpotQuery query,
            @Param("checkedInAfter") LocalDateTime checkedInAfter,
            @Param("offset") long offset,
            @Param("limit") long limit);

    long countCheckinSpots(
            @Param("userId") Long userId,
            @Param("query") CheckinSpotQuery query,
            @Param("checkedInAfter") LocalDateTime checkedInAfter);
}
