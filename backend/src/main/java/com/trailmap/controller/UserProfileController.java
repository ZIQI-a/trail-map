package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.UserProfileUpdateRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.UserProfileOverviewResponse;
import com.trailmap.security.AuthUserPrincipal;
import com.trailmap.service.AppUserService;
import com.trailmap.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 个人主页接口，聚合当前用户的概览统计信息。
 */
@RestController
@RequestMapping("/api/profile")
@Tag(name = "个人主页接口")
public class UserProfileController {

    private final AppUserService appUserService;
    private final UserProfileService userProfileService;

    public UserProfileController(AppUserService appUserService, UserProfileService userProfileService) {
        this.appUserService = appUserService;
        this.userProfileService = userProfileService;
    }

    /**
     * 获取个人主页概览统计，避免前端依赖当前页列表自行计数。
     */
    @GetMapping("/overview")
    @Operation(summary = "获取个人主页概览")
    public ApiResponse<UserProfileOverviewResponse> getOverview(
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        return ApiResponse.success(userProfileService.getOverview(principal.userId()));
    }

    /**
     * 当前用户编辑自己的个人资料，不开放角色和状态等后台字段。
     */
    @PutMapping("/me")
    @Operation(summary = "更新当前用户资料")
    public ApiResponse<AppUserResponse> updateCurrentUserProfile(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        return ApiResponse.success(appUserService.updateCurrentUserProfile(principal.userId(), request));
    }
}
