package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.response.FavoriteSpotStatusResponse;
import com.trailmap.security.AuthUserPrincipal;
import com.trailmap.service.FavoriteSpotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 收藏景点接口，供地图工作台详情面板切换当前用户的收藏状态。
 */
@Validated
@RestController
@RequestMapping("/api/favorite-spots")
@Tag(name = "收藏景点接口")
public class FavoriteSpotController {

    private final FavoriteSpotService favoriteSpotService;

    public FavoriteSpotController(FavoriteSpotService favoriteSpotService) {
        this.favoriteSpotService = favoriteSpotService;
    }

    /**
     * 获取当前用户对某个景点的收藏状态。
     */
    @GetMapping("/{spotId}/status")
    @Operation(summary = "获取景点收藏状态")
    public ApiResponse<FavoriteSpotStatusResponse> getFavoriteStatus(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(favoriteSpotService.getFavoriteStatus(principal.userId(), spotId));
    }

    /**
     * 收藏指定景点；重复点击不会重复创建记录。
     */
    @PostMapping("/{spotId}")
    @Operation(summary = "收藏景点")
    public ApiResponse<FavoriteSpotStatusResponse> favoriteSpot(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(favoriteSpotService.favoriteSpot(principal.userId(), spotId));
    }

    /**
     * 取消收藏指定景点；若原本未收藏，也按成功处理。
     */
    @DeleteMapping("/{spotId}")
    @Operation(summary = "取消收藏景点")
    public ApiResponse<FavoriteSpotStatusResponse> unfavoriteSpot(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(favoriteSpotService.unfavoriteSpot(principal.userId(), spotId));
    }
}
