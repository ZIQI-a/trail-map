package com.trailmap.model.query;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 用户创建请求，后台新增用户和注册接口都复用这组基础字段。
 */
public record UserCreateRequest(
        @NotBlank(message = "用户名不能为空")
        @Size(min = 3, max = 50, message = "用户名长度应为 3 到 50 个字符")
        String username,
        @NotBlank(message = "昵称不能为空")
        @Size(max = 50, message = "昵称最多 50 个字符")
        String nickname,
        String userType,
        @NotBlank(message = "密码不能为空")
        @Size(min = 6, max = 64, message = "密码长度应为 6 到 64 个字符")
        String password,
        @Size(max = 255, message = "头像地址最多 255 个字符")
        String avatarUrl,
        @Pattern(regexp = "^$|^1\\d{10}$", message = "手机号格式不正确")
        String phone,
        @Email(message = "邮箱格式不正确")
        @Size(max = 100, message = "邮箱最多 100 个字符")
        String email,
        @Size(max = 100, message = "地区最多 100 个字符")
        String region,
        Integer status
) {
}
