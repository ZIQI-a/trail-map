package com.trailmap.service;

import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PoiCalibrationCandidateResponse;
import java.util.List;

/**
 * POI 校准服务，负责从第三方地图平台拉取候选点位，辅助修正精选景点主点位。
 */
public interface PoiCalibrationService {

    List<PoiCalibrationCandidateResponse> searchCandidates(String cityName, String keyword, String addressKeyword);

    // 搜索 nearby 候选点
    List<PoiCalibrationCandidateResponse> searchNearbyCandidates(String cityName, CoordinateResponse center,
            String keyword, int radiusMeters);
}
