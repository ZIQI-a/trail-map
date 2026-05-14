package com.trailmap.model.response;

/**
 * 登录响应，token 供前端后续请求通过 Authorization Bearer 携带。
 */
public record AuthLoginResponse(
        String token,
        String tokenType,
        AppUserResponse user
) {
}
