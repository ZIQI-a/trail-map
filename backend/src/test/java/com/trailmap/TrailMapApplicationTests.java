package com.trailmap;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 应用上下文测试，确保 Spring Boot 基础配置可以正常加载。
 */
@SpringBootTest
class TrailMapApplicationTests {

    @Test
    void contextLoads() {
        // 空测试即可触发 Spring 上下文加载，第一阶段用于验证项目骨架。
    }
}
