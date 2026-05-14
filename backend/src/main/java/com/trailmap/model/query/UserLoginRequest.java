package com.trailmap.model.query;

import jakarta.validation.constraints.NotBlank;

/**
 * 登录请求，当前用用户名和密码校验用户身份。
 */
public record UserLoginRequest(
        @NotBlank(message = "用户名不能为空")
        String username,
        @NotBlank(message = "密码不能为空")
        String password
) {
}
