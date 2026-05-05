package com.trailmap.service;

import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SpotQuery;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.SpotDetailResponse;
import com.trailmap.model.response.SpotSummaryResponse;

/**
 * 景点服务接口，负责景点列表筛选和详情查询。
 */
public interface SpotService {

    PageResponse<SpotSummaryResponse> listSpotsByCity(Long cityId, SpotQuery query, PageQuery pageQuery);

    SpotDetailResponse getSpot(Long spotId);
}
