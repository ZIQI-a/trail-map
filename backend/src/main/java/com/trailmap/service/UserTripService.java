package com.trailmap.service;

import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SaveTripRequest;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.TripDetailResponse;
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
    PageResponse<TripSummaryResponse> listUserTrips(Long userId, PageQuery pageQuery);

    /**
     * 获取行程详情。
     */
    TripDetailResponse getTripDetail(Long userId, Long tripId);

    /**
     * 删除行程。
     */
    void deleteTrip(Long userId, Long tripId);
}
