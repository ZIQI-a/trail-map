package com.trailmap.service;

import com.trailmap.model.query.AdminSpotCreateRequest;
import com.trailmap.model.query.AdminSpotUpdateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.AdminSpotResponse;
import com.trailmap.model.response.PageResponse;

/**
 * 管理端景点服务，负责景点资料维护和后台列表查询。
 */
public interface AdminSpotService {

    PageResponse<AdminSpotResponse> listSpots(PageQuery pageQuery, Long cityId, String keyword, String type, Integer status);

    AdminSpotResponse getSpot(Long spotId);

    AdminSpotResponse createSpot(AdminSpotCreateRequest request);

    AdminSpotResponse updateSpot(Long spotId, AdminSpotUpdateRequest request);

    void deleteSpot(Long spotId);
}
