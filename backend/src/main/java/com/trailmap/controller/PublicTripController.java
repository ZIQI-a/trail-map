package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.response.TripDetailResponse;
import com.trailmap.service.UserTripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 公开行程接口，允许未登录用户通过分享令牌查看已公开行程。
 */
@RestController
@RequestMapping("/api/public-trips")
@Tag(name = "公开行程接口")
public class PublicTripController {

    private final UserTripService userTripService;

    public PublicTripController(UserTripService userTripService) {
        this.userTripService = userTripService;
    }

    /**2
     * 根据分享令牌获取公开行程详情。
     */
    @GetMapping("/{shareToken}")
    @Operation(summary = "获取公开行程详情")
    public ApiResponse<TripDetailResponse> getPublicTripDetail(@PathVariable String shareToken) {
        return ApiResponse.success(userTripService.getPublicTripDetail(shareToken));
    }
}
