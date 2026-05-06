package com.trailmap.model.response;

/**
 * POI 校准候选项，供开发阶段挑选更合适的景点主点位。
 */
public record PoiCalibrationCandidateResponse(
        String name,
        String uid,
        String address,
        String province,
        String city,
        String area,
        CoordinateResponse location,
        CoordinateResponse naviLocation,
        String detailUrl,
        String sourceProvider
) {
}
