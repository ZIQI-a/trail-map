package com.trailmap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

/**
 * 后端应用启动类，负责启动 TrailMap 的 Spring Boot 服务。
 *
 * <p>第一阶段暂不连接数据库，所以排除数据源自动配置；接入 MySQL 时需要移除该排除项。
 */
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class TrailMapApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrailMapApplication.class, args);
    }
}
