package com.trailmap;

import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

/**
 * 后端应用启动类，负责启动 TrailMap 的 Spring Boot 服务。
 */
@MapperScan("com.trailmap.mapper")
@SpringBootApplication
@ConfigurationPropertiesScan("com.trailmap.config")
public class TrailMapApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrailMapApplication.class, args);
    }
}
