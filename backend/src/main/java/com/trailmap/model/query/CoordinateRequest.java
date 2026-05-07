package com.trailmap.model.query;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * 坐标请求对象，和响应坐标拆开，便于后续给请求增加校验规则。
 */
public record CoordinateRequest(
        @NotNull(message = "经度不能为空")
        BigDecimal lng,
        @NotNull(message = "纬度不能为空")
        BigDecimal lat
) {
}
