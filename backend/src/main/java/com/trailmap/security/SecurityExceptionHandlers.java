package com.trailmap.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailmap.common.ApiResponse;
import com.trailmap.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/**
 * Spring Security 异常处理器，统一把未登录和无权限响应转换成项目约定的 JSON 结构。
 */
@Component
public class SecurityExceptionHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        writeUnauthorized(response, "请先登录");
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        writeJson(response, HttpServletResponse.SC_FORBIDDEN,
                ApiResponse.failure(ErrorCode.FORBIDDEN, "仅管理员可访问该接口"));
    }

    /**
     * 过滤器在解析 Bearer Token 失败时直接复用这里的 401 输出，保证响应结构一致。
     */
    public void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
                ApiResponse.failure(ErrorCode.UNAUTHORIZED, message));
    }

    private void writeJson(
            HttpServletResponse response,
            int statusCode,
            ApiResponse<Void> payload) throws IOException {
        response.setStatus(statusCode);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        OBJECT_MAPPER.writeValue(response.getWriter(), payload);
    }
}
