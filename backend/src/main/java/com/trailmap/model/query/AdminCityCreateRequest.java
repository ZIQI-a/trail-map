package com.trailmap.model.query;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * 管理端新增城市请求，字段与 city 表保持一致，便于后台做基础资料维护。
 */
public record AdminCityCreateRequest(
        @NotBlank(message = "城市名称不能为空")
        @Size(max = 50, message = "城市名称最多 50 个字符")
        String cityName,
        @NotBlank(message = "所属省份不能为空")
        @Size(max = 50, message = "所属省份最多 50 个字符")
        String provinceName,
        @NotBlank(message = "城市编码不能为空")
        @Size(max = 50, message = "城市编码最多 50 个字符")
        String cityCode,
        @NotNull(message = "城市中心经度不能为空")
        @DecimalMin(value = "-180.000000", message = "城市中心经度超出范围")
        @DecimalMax(value = "180.000000", message = "城市中心经度超出范围")
        @Digits(integer = 3, fraction = 6, message = "城市中心经度最多保留 6 位小数")
        BigDecimal centerLng,
        @NotNull(message = "城市中心纬度不能为空")
        @DecimalMin(value = "-90.000000", message = "城市中心纬度超出范围")
        @DecimalMax(value = "90.000000", message = "城市中心纬度超出范围")
        @Digits(integer = 2, fraction = 6, message = "城市中心纬度最多保留 6 位小数")
        BigDecimal centerLat,
        @NotNull(message = "默认缩放级别不能为空")
        @PositiveOrZero(message = "默认缩放级别不能小于 0")
        Integer mapZoom,
        @Size(max = 255, message = "封面图地址最多 255 个字符")
        String coverUrl,
        @Size(max = 500, message = "城市简介最多 500 个字符")
        String description,
        @DecimalMin(value = "0.0", inclusive = false, message = "推荐游玩天数必须大于 0")
        @Digits(integer = 2, fraction = 1, message = "推荐游玩天数格式不正确")
        BigDecimal recommendDays,
        @PositiveOrZero(message = "热度不能小于 0")
        Integer hotScore,
        @PositiveOrZero(message = "排序不能小于 0")
        Integer sortOrder,
        Integer status
) {
}
