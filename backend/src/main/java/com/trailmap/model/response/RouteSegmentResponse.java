package com.trailmap.model.response;

import java.util.List;

/**
 * 路线分段响应对象。
 * 每一段都对应一次真实地图路线查询结果，后续可直接落到 route_segment 表。
 */
public record RouteSegmentResponse(
        Integer segmentIndex,
        String fromName,
        CoordinateResponse fromPosition,
        String toName,
        CoordinateResponse toPosition,
        String transportType,
        Integer distanceMeters,
        Integer durationSeconds,
        String instruction,
        List<CoordinateResponse> polyline,
        List<String> stepTexts
) {
}
