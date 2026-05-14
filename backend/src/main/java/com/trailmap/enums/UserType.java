package com.trailmap.enums;

import java.util.Locale;

/**
 * 用户类型枚举，先用于数据约束和接口返回，后续可继续扩展权限规则。
 */
public enum UserType {
    NORMAL("normal"),
    MEMBER("member"),
    ADMIN("admin");

    private final String code;

    UserType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    /**
     * 用户类型为空时默认普通用户，避免注册时必须让前端传固定值。
     */
    public static String normalizeOrDefault(String userType) {
        if (userType == null || userType.isBlank()) {
            return NORMAL.code;
        }

        String normalizedType = userType.toLowerCase(Locale.ROOT);
        for (UserType type : values()) {
            if (type.code.equals(normalizedType)) {
                return normalizedType;
            }
        }
        throw new IllegalArgumentException("不支持的用户类型: " + userType);
    }
}
