package com.trailmap.service;

import com.trailmap.model.query.AdminCityCreateRequest;
import com.trailmap.model.query.AdminCityUpdateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.AdminCityResponse;
import com.trailmap.model.response.PageResponse;

/**
 * 管理端城市服务，负责城市资料的增删改查。
 */
public interface AdminCityService {

    PageResponse<AdminCityResponse> listCities(PageQuery pageQuery, String keyword);

    AdminCityResponse getCity(Long cityId);

    AdminCityResponse createCity(AdminCityCreateRequest request);

    AdminCityResponse updateCity(Long cityId, AdminCityUpdateRequest request);

    void deleteCity(Long cityId);
}
