package com.trailmap.model.query;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

/**
 * 行程规划请求对象。
 * 当前先覆盖自由路线模式需要的核心字段，同时为完整行程模式预留时间和强度参数。
 */
public record RoutePlanRequest(
        @NotNull(message = "城市不能为空")
        Long cityId,
        @NotNull(message = "起点不能为空")
        @Valid
        RouteLocationRequest startPoint,
        @Valid
        RouteLocationRequest endPoint,
        @NotEmpty(message = "至少选择一个景点")
        List<Long> spotIds,
        @NotBlank(message = "交通方式不能为空")
        String transportType,
        @NotBlank(message = "规划模式不能为空")
        String planMode,
        String orderMode,
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "出行日期格式必须为 yyyy-MM-dd")
        String travelDate,
        @Min(value = 1, message = "游玩天数至少为 1")
        Integer tripDays,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "每日开始时间格式必须为 HH:mm")
        String dailyStartTime,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "每日结束时间格式必须为 HH:mm")
        String dailyEndTime,
        Boolean includeLunchBreak,
        Boolean includeNightTour,
        String intensity
) {
}
