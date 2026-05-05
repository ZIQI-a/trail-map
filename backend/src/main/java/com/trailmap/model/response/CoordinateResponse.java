package com.trailmap.model.response;

import java.math.BigDecimal;

/**
 * 坐标响应对象，统一城市中心点和景点坐标的返回结构。
 */
public record CoordinateResponse(BigDecimal lng, BigDecimal lat) {
}
