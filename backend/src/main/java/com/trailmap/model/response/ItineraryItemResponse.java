package com.trailmap.model.response;

/**
 * 行程时间轴节点。
 * 既支持景点，也支持午餐、休息、酒店等实时地点块，避免完整行程只能表达“景点”。
 */
public record ItineraryItemResponse(
        Integer sequence,
        String itemType,
        String title,
        String placeName,
        String placeType,
        CoordinateResponse position,
        Integer durationMinutes,
        String suggestedStartTime,
        String suggestedEndTime,
        Long relatedSpotId,
        String note
) {
}
