package com.trailmap.service;

import com.trailmap.model.query.UserCreateRequest;
import com.trailmap.model.query.UserLoginRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.AuthLoginResponse;

/**
 * 认证服务，负责注册、登录和根据令牌获取当前用户。
 */
public interface AuthService {

    AuthLoginResponse register(UserCreateRequest request);

    AuthLoginResponse login(UserLoginRequest request);

    AppUserResponse getCurrentUser(String authorizationHeader);
}
