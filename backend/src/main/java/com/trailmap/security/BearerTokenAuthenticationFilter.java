package com.trailmap.security;

import com.trailmap.entity.AppUser;
import com.trailmap.exception.UnauthorizedException;
import com.trailmap.service.AuthTokenService;
import com.trailmap.service.impl.AppUserServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Bearer Token 认证过滤器，负责把现有 HMAC 登录令牌接入 Spring Security 上下文。
 */
@Component
public class BearerTokenAuthenticationFilter extends OncePerRequestFilter {

    private final AuthTokenService authTokenService;
    private final AppUserServiceImpl appUserService;
    private final SecurityExceptionHandlers securityExceptionHandlers;

    public BearerTokenAuthenticationFilter(
            AuthTokenService authTokenService,
            AppUserServiceImpl appUserService,
            SecurityExceptionHandlers securityExceptionHandlers) {
        this.authTokenService = authTokenService;
        this.appUserService = appUserService;
        this.securityExceptionHandlers = securityExceptionHandlers;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");
        if (!StringUtils.hasText(authorizationHeader)
                || SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Long userId = authTokenService.verifyToken(authorizationHeader);
            AppUser user = appUserService.loadActiveUser(userId);
            AuthUserPrincipal principal = new AuthUserPrincipal(
                    user.getId(),
                    user.getUsername(),
                    user.getNickname(),
                    user.getUserType());
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            principal.authorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (UnauthorizedException exception) {
            SecurityContextHolder.clearContext();
            securityExceptionHandlers.writeUnauthorized(response, exception.getMessage());
        }
    }
}
