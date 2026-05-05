package com.trailmap.common;

/**
 * 统一接口返回体，保证前后端联调时响应结构稳定。
 *
 * @param success 请求是否成功
 * @param code 业务状态码
 * @param message 业务提示信息
 * @param data 业务数据
 * @param <T> 数据类型
 */
public record ApiResponse<T>(boolean success, String code, String message, T data) {

    /**
     * 成功返回时统一使用 SUCCESS 码，减少前端判断分支。
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, ErrorCode.SUCCESS, "ok", data);
    }

    /**
     * 失败返回仍然保持统一结构，避免把异常堆栈直接暴露给前端。
     */
    public static <T> ApiResponse<T> failure(String code, String message) {
        return new ApiResponse<>(false, code, message, null);
    }
}
