package com.trailmap.model.query;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新行程名称请求。
 */
public record UpdateTripNameRequest(
        @NotBlank(message = "行程名称不能为空")
        @Size(max = 100, message = "行程名称不能超过 100 个字符")
        String tripName
) {
}
