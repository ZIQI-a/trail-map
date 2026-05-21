package com.trailmap.service;

import com.trailmap.model.query.CheckinSpotQuery;
import com.trailmap.model.query.CheckinSpotRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CheckinSpotItemResponse;
import com.trailmap.model.response.CheckinSpotStatusResponse;
import com.trailmap.model.response.PageResponse;

/**
 * 打卡景点服务接口，负责当前登录用户的个人足迹关系。
 */
public interface CheckinSpotService {
    // 查询用户打卡景点列表
    PageResponse<CheckinSpotItemResponse> listCheckinSpots(Long userId, CheckinSpotQuery query, PageQuery pageQuery);

    // 查询用户打卡状态
    CheckinSpotStatusResponse getCheckinStatus(Long userId, Long spotId);

    // 打卡指定景点
    CheckinSpotStatusResponse checkinSpot(Long userId, Long spotId, CheckinSpotRequest request);

    // 取消打卡指定景点
    CheckinSpotStatusResponse uncheckinSpot(Long userId, Long spotId);
}
