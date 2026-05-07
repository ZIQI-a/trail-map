package com.trailmap.model.query;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 路线规划起终点请求对象，既可表示酒店，也可表示用户输入的任意地点。
 */
public record RouteLocationRequest(
        @NotBlank(message = "地点名称不能为空")
        String name,
        @NotNull(message = "地点坐标不能为空")
        @Valid
        CoordinateRequest position,
        String address
) {
}
