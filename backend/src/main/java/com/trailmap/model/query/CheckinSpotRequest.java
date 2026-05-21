package com.trailmap.model.query;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * 景点打卡请求参数。
 *
 */
public record CheckinSpotRequest(
                @DecimalMin(value = "-180.0", message = "经度不能小于 -180") @DecimalMax(value = "180.0", message = "经度不能大于 180") BigDecimal checkinLng,

                @DecimalMin(value = "-90.0", message = "纬度不能小于 -90") @DecimalMax(value = "90.0", message = "纬度不能大于 90") BigDecimal checkinLat,

                @Size(max = 500, message = "打卡备注不能超过 500 字") String remark) {
}
