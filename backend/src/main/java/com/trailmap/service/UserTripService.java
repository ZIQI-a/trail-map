package com.trailmap.service;

import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SaveTripRequest;
import com.trailmap.model.query.UserTripQuery;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.TripDetailResponse;
import com.trailmap.model.response.TripShareResponse;
import com.trailmap.model.response.TripSummaryResponse;

/**
 * 用户行程服务接口。
 */
public interface UserTripService {

    /**
     * 保存用户行程。
     */
    Long saveTrip(Long userId, SaveTripRequest request);

    /**
     * 获取当前用户的行程列表。
     */
    PageResponse<TripSummaryResponse> listUserTrips(Long userId, UserTripQuery query, PageQuery pageQuery);

    /**
     * 获取行程详情。
     */
    TripDetailResponse getTripDetail(Long userId, Long tripId);

    /**
     * 获取公开分享行程详情。
     */
    TripDetailResponse getPublicTripDetail(String shareToken);

    /**
     * 开启或关闭行程公开分享。
     */
    TripShareResponse updateTripShare(Long userId, Long tripId, boolean enabled);

    /**
     * 更新行程名称。
     */
    void updateTripName(Long userId, Long tripId, String tripName);

    /**
     * 删除行程。
     */
    void deleteTrip(Long userId, Long tripId);
}
