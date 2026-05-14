package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.UserCreateRequest;
import com.trailmap.model.query.UserUpdateRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.AppUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户管理接口，先提供基础增删改查，后续再叠加管理员权限限制。
 */
@Validated
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理接口")
public class UserController {

    private final AppUserService appUserService;

    public UserController(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    /**
     * 查询用户列表，默认不分页；传 pageNum 或 pageSize 时启用分页。
     */
    @GetMapping
    @Operation(summary = "获取用户列表")
    public ApiResponse<PageResponse<AppUserResponse>> listUsers(
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") @Parameter(description = "页号，非必传") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") @Parameter(description = "每页大小，非必传") Integer pageSize) {
        return ApiResponse.success(appUserService.listUsers(new PageQuery(pageNum, pageSize)));
    }

    /**
     * 获取单个用户详情，不返回密码哈希。
     */
    @GetMapping("/{userId}")
    @Operation(summary = "获取用户详情")
    public ApiResponse<AppUserResponse> getUser(
            @PathVariable @Positive(message = "用户 ID 必须大于 0") Long userId) {
        return ApiResponse.success(appUserService.getUser(userId));
    }

    /**
     * 后台新增用户。普通注册应优先使用 /api/auth/register。
     */
    @PostMapping
    @Operation(summary = "新增用户")
    public ApiResponse<AppUserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        return ApiResponse.success(appUserService.createUser(request));
    }

    /**
     * 更新用户资料，密码重置后续单独提供接口。
     */
    @PutMapping("/{userId}")
    @Operation(summary = "更新用户")
    public ApiResponse<AppUserResponse> updateUser(
            @PathVariable @Positive(message = "用户 ID 必须大于 0") Long userId,
            @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.success(appUserService.updateUser(userId, request));
    }

    /**
     * 删除用户采用逻辑删除，保留历史收藏、打卡和行程关联的可追溯性。
     */
    @DeleteMapping("/{userId}")
    @Operation(summary = "删除用户")
    public ApiResponse<Void> deleteUser(
            @PathVariable @Positive(message = "用户 ID 必须大于 0") Long userId) {
        appUserService.deleteUser(userId);
        return ApiResponse.success(null);
    }
}
