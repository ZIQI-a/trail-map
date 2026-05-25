package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SaveTripRequest;
import com.trailmap.model.query.UpdateTripNameRequest;
import com.trailmap.model.query.UserTripQuery;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.TripDetailResponse;
import com.trailmap.model.response.TripShareResponse;
import com.trailmap.model.response.TripSummaryResponse;
import com.trailmap.security.AuthUserPrincipal;
import com.trailmap.service.UserTripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户行程接口，负责行程的保存、查询和管理。
 */
@Validated
@RestController
@RequestMapping("/api/user-trips")
@Tag(name = "用户行程接口")
public class UserTripController {

    private final UserTripService userTripService;

    public UserTripController(UserTripService userTripService) {
        this.userTripService = userTripService;
    }

    /**
     * 保存用户规划好的行程。
     */
    @PostMapping
    @Operation(summary = "保存行程")
    public ApiResponse<Long> saveTrip(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @Valid @RequestBody SaveTripRequest request) {
        return ApiResponse.success(userTripService.saveTrip(principal.userId(), request));
    }

    /**
     * 获取当前用户的行程列表。
     */
    @GetMapping
    @Operation(summary = "获取我的行程列表")
    public ApiResponse<PageResponse<TripSummaryResponse>> listUserTrips(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) String cityName,
            @RequestParam(required = false) String planMode,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") Integer pageSize) {
        return ApiResponse.success(userTripService.listUserTrips(
                principal.userId(),
                new UserTripQuery(cityName, planMode, sortBy),
                new PageQuery(pageNum, pageSize)));
    }

    /**
     * 获取指定行程的详细信息。
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取行程详情")
    public ApiResponse<TripDetailResponse> getTripDetail(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "行程 ID 必须大于 0") Long id) {
        return ApiResponse.success(userTripService.getTripDetail(principal.userId(), id));
    }

    /**
     * 更新指定行程的公开分享状态。
     */
    @PutMapping("/{id}/share")
    @Operation(summary = "更新行程公开分享状态")
    public ApiResponse<TripShareResponse> updateTripShare(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "行程 ID 必须大于 0") Long id,
            @RequestParam Boolean enabled) {
        return ApiResponse.success(userTripService.updateTripShare(principal.userId(), id, Boolean.TRUE.equals(enabled)));
    }

    /**
     * 更新指定行程的名称。
     */
    @PatchMapping("/{id}/name")
    @Operation(summary = "更新行程名称")
    public ApiResponse<Void> updateTripName(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "行程 ID 必须大于 0") Long id,
            @Valid @RequestBody UpdateTripNameRequest request) {
        userTripService.updateTripName(principal.userId(), id, request.tripName());
        return ApiResponse.success(null);
    }

    /**
     * 删除指定的行程。
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除行程")
    public ApiResponse<Void> deleteTrip(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "行程 ID 必须大于 0") Long id) {
        userTripService.deleteTrip(principal.userId(), id);
        return ApiResponse.success(null);
    }
}
