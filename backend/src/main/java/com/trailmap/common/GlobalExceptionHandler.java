package com.trailmap.common;

import com.trailmap.exception.BusinessException;
import com.trailmap.exception.UnauthorizedException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器，负责把校验失败和业务失败转换成统一响应。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理主动抛出的业务异常，保留明确的业务提示。
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBusinessException(BusinessException exception) {
        log.warn("业务异常: code={}, message={}", exception.getCode(), exception.getMessage());
        return ApiResponse.failure(exception.getCode(), exception.getMessage());
    }

    /**
     * 登录态异常单独返回 401，方便前端区分“参数错”和“需要登录”。
     */
    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleUnauthorizedException(UnauthorizedException exception) {
        log.warn("登录态异常: code={}, message={}", exception.getCode(), exception.getMessage());
        return ApiResponse.failure(exception.getCode(), exception.getMessage());
    }

    /**
     * 处理路径参数、查询参数等约束校验失败。
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleConstraintViolationException(ConstraintViolationException exception) {
        log.warn("参数约束校验失败: {}", exception.getMessage());
        return ApiResponse.failure(ErrorCode.BAD_REQUEST, exception.getMessage());
    }

    /**
     * 处理请求体校验失败，当前阶段主要兜底未来扩展场景。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("请求参数校验失败");
        log.warn("请求体校验失败: {}", message);
        return ApiResponse.failure(ErrorCode.BAD_REQUEST, message);
    }

    /**
     * 兜底处理未知异常，避免把底层异常细节直接返回给前端。
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception exception) {
        log.error("未处理异常", exception);
        return ApiResponse.failure(ErrorCode.INTERNAL_ERROR, "服务开小差了，请稍后重试");
    }
}
