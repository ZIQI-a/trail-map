package com.trailmap.model.query;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * 管理端更新景点请求，按需覆盖景点基础资料和展示属性。
 */
public record AdminSpotUpdateRequest(
        @Positive(message = "所属城市必须大于 0")
        Long cityId,
        @Size(max = 100, message = "景点名称最多 100 个字符")
        String spotName,
        @Size(max = 50, message = "景点类型最多 50 个字符")
        String spotType,
        @DecimalMin(value = "-180.000000", message = "景点经度超出范围")
        @DecimalMax(value = "180.000000", message = "景点经度超出范围")
        @Digits(integer = 3, fraction = 6, message = "景点经度最多保留 6 位小数")
        BigDecimal lng,
        @DecimalMin(value = "-90.000000", message = "景点纬度超出范围")
        @DecimalMax(value = "90.000000", message = "景点纬度超出范围")
        @Digits(integer = 2, fraction = 6, message = "景点纬度最多保留 6 位小数")
        BigDecimal lat,
        @Size(max = 255, message = "景点地址最多 255 个字符")
        String address,
        @Size(max = 100, message = "高德 POI ID 最多 100 个字符")
        String amapPoiId,
        String boundaryGeojson,
        @Size(max = 255, message = "封面图地址最多 255 个字符")
        String coverUrl,
        @Size(max = 500, message = "景点摘要最多 500 个字符")
        String summary,
        String description,
        String recommendReason,
        String travelGuide,
        @Size(max = 255, message = "开放时间最多 255 个字符")
        String openingHours,
        @Size(max = 255, message = "门票信息最多 255 个字符")
        String ticketInfo,
        @PositiveOrZero(message = "建议游玩时长不能小于 0")
        Integer suggestedDuration,
        @Size(max = 100, message = "推荐游玩时间最多 100 个字符")
        String bestTime,
        @DecimalMin(value = "0.0", inclusive = false, message = "推荐指数必须大于 0")
        @DecimalMax(value = "9.9", message = "推荐指数不能超过 9.9")
        @Digits(integer = 1, fraction = 1, message = "推荐指数格式不正确")
        BigDecimal recommendScore,
        @PositiveOrZero(message = "热度不能小于 0")
        Integer hotScore,
        @Size(max = 255, message = "适合人群最多 255 个字符")
        String suitableCrowd,
        Integer isFree,
        Integer isIndoor,
        Integer isNight,
        Integer isRainyDay,
        Integer subwayFriendly,
        Integer firstVisit,
        @PositiveOrZero(message = "排序不能小于 0")
        Integer sortOrder,
        Integer status
) {
}
