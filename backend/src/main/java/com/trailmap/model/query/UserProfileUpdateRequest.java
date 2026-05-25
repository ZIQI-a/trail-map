package com.trailmap.model.query;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 当前用户资料更新请求，只开放个人可编辑字段。
 */
public record UserProfileUpdateRequest(
        @Size(max = 50, message = "昵称最多 50 个字符")
        String nickname,
        @Size(max = 255, message = "头像地址最多 255 个字符")
        String avatarUrl,
        @Pattern(regexp = "^$|^1\\d{10}$", message = "手机号格式不正确")
        String phone,
        @Email(message = "邮箱格式不正确")
        @Size(max = 100, message = "邮箱最多 100 个字符")
        String email,
        @Size(max = 100, message = "地区最多 100 个字符")
        String region
) {
}
