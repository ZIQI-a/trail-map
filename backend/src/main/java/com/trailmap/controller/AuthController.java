package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.UserCreateRequest;
import com.trailmap.model.query.UserLoginRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.AuthLoginResponse;
import com.trailmap.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口，负责注册、登录和当前用户校验。
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "认证接口")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 用户注册。注册成功后直接返回登录令牌，前端可进入已登录状态。
     */
    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public ApiResponse<AuthLoginResponse> register(@Valid @RequestBody UserCreateRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    /**
     * 用户登录。校验用户名和密码后返回 Bearer Token。
     */
    @PostMapping("/login")
    @Operation(summary = "用户登录")
    public ApiResponse<AuthLoginResponse> login(@Valid @RequestBody UserLoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    /**
     * 当前用户查询。前端通过 Authorization: Bearer token 携带登录态。
     */
    @GetMapping("/me")
    @Operation(summary = "获取当前用户")
    public ApiResponse<AppUserResponse> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return ApiResponse.success(authService.getCurrentUser(authorizationHeader));
    }
}
