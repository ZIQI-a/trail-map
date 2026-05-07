package com.trailmap.model.response;

/**
 * 景点停留安排响应对象。
 * 自由路线模式至少返回建议停留时长，完整行程模式再补开始/结束时间和所属天数。
 */
public record RouteSpotStayPlanResponse(
        Long spotId,
        String spotName,
        Integer suggestedDurationMinutes,
        String suggestedStartTime,
        String suggestedEndTime,
        Integer dayIndex
) {
}
