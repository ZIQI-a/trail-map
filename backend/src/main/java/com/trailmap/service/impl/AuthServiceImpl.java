package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.AppUser;
import com.trailmap.enums.UserType;
import com.trailmap.exception.BusinessException;
import com.trailmap.mapper.AppUserMapper;
import com.trailmap.model.query.UserCreateRequest;
import com.trailmap.model.query.UserLoginRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.AuthLoginResponse;
import com.trailmap.service.AppUserService;
import com.trailmap.service.AuthService;
import com.trailmap.service.AuthTokenService;
import com.trailmap.service.PasswordHashService;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现，当前负责注册、登录和 Bearer Token 用户解析。
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final int STATUS_ENABLED = 1;

    private final AppUserService appUserService;
    private final AppUserMapper appUserMapper;
    private final PasswordHashService passwordHashService;
    private final AuthTokenService authTokenService;

    public AuthServiceImpl(
            AppUserService appUserService,
            AppUserMapper appUserMapper,
            PasswordHashService passwordHashService,
            AuthTokenService authTokenService) {
        this.appUserService = appUserService;
        this.appUserMapper = appUserMapper;
        this.passwordHashService = passwordHashService;
        this.authTokenService = authTokenService;
    }

    @Override
    public AuthLoginResponse register(UserCreateRequest request) {
        // 普通注册入口不允许前端自定义管理员或会员身份，用户类型统一从 normal 起步。
        UserCreateRequest normalizedRequest = new UserCreateRequest(
                request.username(),
                request.nickname(),
                UserType.NORMAL.getCode(),
                request.password(),
                request.avatarUrl(),
                request.phone(),
                request.email(),
                request.region(),
                STATUS_ENABLED);
        AppUserResponse user = appUserService.createUser(normalizedRequest);
        return new AuthLoginResponse(authTokenService.issueToken(user.id()), "Bearer", user);
    }

    @Override
    public AuthLoginResponse login(UserLoginRequest request) {
        AppUser user = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getUsername, request.username().trim())
                .last("limit 1"));
        if (user == null || !passwordHashService.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "用户名或密码错误");
        }
        if (!Integer.valueOf(STATUS_ENABLED).equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "账号已停用");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        appUserMapper.updateById(user);
        return new AuthLoginResponse(
                authTokenService.issueToken(user.getId()),
                "Bearer",
                toResponse(user));
    }

    @Override
    public AppUserResponse getCurrentUser(String authorizationHeader) {
        Long userId = authTokenService.verifyToken(authorizationHeader);
        return appUserService.getUser(userId);
    }

    private AppUserResponse toResponse(AppUser user) {
        return new AppUserResponse(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getUserType(),
                user.getAvatarUrl(),
                user.getPhone(),
                user.getEmail(),
                user.getRegion(),
                user.getStatus(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
