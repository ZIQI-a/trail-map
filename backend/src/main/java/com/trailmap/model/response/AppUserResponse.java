package com.trailmap.model.response;

import java.time.LocalDateTime;

/**
 * 用户响应对象，不返回 passwordHash，避免把敏感字段暴露给前端。
 */
public record AppUserResponse(
        Long id,
        String username,
        String nickname,
        String userType,
        String avatarUrl,
        String phone,
        String email,
        Integer status,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
