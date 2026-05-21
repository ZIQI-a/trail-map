package com.trailmap.model.response;

import java.time.LocalDateTime;

/**
 * 打卡状态响应对象，供前端决定打卡按钮展示。
 */
public record CheckinSpotStatusResponse(
        boolean checkedIn,
        LocalDateTime checkedInAt,
        String remark
) {
}
