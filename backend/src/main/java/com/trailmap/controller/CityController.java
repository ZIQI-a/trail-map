package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CitySummaryResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.CityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 城市接口，负责给前端提供城市选择和城市基础展示信息。
 */
@Validated
@RestController
@RequestMapping("/api/cities")
@Tag(name = "城市接口")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    /**
     * 返回已启用城市列表，供首页或地图工作台城市切换使用。
     */
    @GetMapping
    @Operation(summary = "获取城市列表")
    public ApiResponse<PageResponse<CitySummaryResponse>> listCities(
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") @Parameter(description = "页号，非必传") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") @Parameter(description = "每页大小，非必传") Integer pageSize
    ) {
        return ApiResponse.success(cityService.listCities(new PageQuery(pageNum, pageSize)));
    }

    /**
     * 返回单个城市详情，便于地图初始化时拿到中心点和缩放级别。
     */
    @GetMapping("/{cityId}")
    @Operation(summary = "获取城市详情")
    public ApiResponse<CitySummaryResponse> getCity(@PathVariable @Positive(message = "城市 ID 必须大于 0") Long cityId) {
        return ApiResponse.success(cityService.getCity(cityId));
    }
}
