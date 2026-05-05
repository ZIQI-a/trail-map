package com.trailmap.service;

import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CitySummaryResponse;
import com.trailmap.model.response.PageResponse;

/**
 * 城市服务接口，负责封装城市列表和详情查询逻辑。
 */
public interface CityService {

    PageResponse<CitySummaryResponse> listCities(PageQuery pageQuery);

    CitySummaryResponse getCity(Long cityId);
}
