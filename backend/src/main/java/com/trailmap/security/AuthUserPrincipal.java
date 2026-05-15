package com.trailmap.security;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * 登录用户主体，供 Spring Security 在鉴权阶段识别当前用户和角色。
 */
public record AuthUserPrincipal(
        Long userId,
        String username,
        String nickname,
        String userType
) {

    /**
     * 当前阶段按用户类型直接映射单一角色，后续可在这里扩展多角色或细粒度权限。
     */
    public Collection<? extends GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + userType.toUpperCase()));
    }
}
