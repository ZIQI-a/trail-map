package com.trailmap.exception;

/**
 * 业务异常，用于向统一异常处理层传递可读错误信息。
 */
public class BusinessException extends RuntimeException {

    private final String code;

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
