package com.trailmap.exception;

import com.trailmap.common.ErrorCode;

/**
 * 未登录或登录令牌无效时抛出，统一交给异常处理器返回 401。
 */
public class UnauthorizedException extends RuntimeException {

    private final String code;

    public UnauthorizedException(String message) {
        super(message);
        this.code = ErrorCode.UNAUTHORIZED;
    }

    public String getCode() {
        return code;
    }
}
