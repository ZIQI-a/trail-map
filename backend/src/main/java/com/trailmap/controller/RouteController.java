package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.RoutePlanRequest;
import com.trailmap.model.response.RoutePlanResponse;
import com.trailmap.service.RoutePlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 行程规划控制器，当前先承接自由路线模式的后端主流程。
 */
@Tag(name = "Route", description = "行程规划接口")
@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RoutePlanService routePlanService;

    public RouteController(RoutePlanService routePlanService) {
        this.routePlanService = routePlanService;
    }

    @Operation(summary = "生成行程规划", description = "根据起点、景点池和交通方式生成一份可展示的行程结果")
    @PostMapping("/plan")
    public ApiResponse<RoutePlanResponse> plan(@Valid @RequestBody RoutePlanRequest request) {
        return ApiResponse.success(routePlanService.plan(request));
    }
}
