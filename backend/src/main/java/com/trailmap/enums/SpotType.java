package com.trailmap.enums;

import java.util.Arrays;

/**
 * 景点类型枚举，和数据库草案中的 spot_type 保持一致。
 */
public enum SpotType {
    HISTORY("history", "历史文化"),
    NATURE("nature", "自然风光"),
    LANDMARK("landmark", "城市地标"),
    MUSEUM("museum", "博物馆展馆"),
    FOOD("food", "美食街区"),
    NIGHT("night", "夜游景点"),
    FAMILY("family", "亲子游玩"),
    BUSINESS("business", "商圈街区");

    private final String code;
    private final String label;

    SpotType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    /**
     * 查询参数按 code 传递，枚举负责集中校验，避免控制层散落硬编码。
     */
    public static boolean supports(String code) {
        return Arrays.stream(values()).anyMatch(item -> item.code.equals(code));
    }
}
