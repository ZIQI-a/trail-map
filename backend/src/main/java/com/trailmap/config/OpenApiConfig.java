package com.trailmap.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 配置，先提供基础接口文档入口，便于阶段 3 联调查看契约。
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI trailMapOpenApi() {
        return new OpenAPI().info(new Info()
                .title("TrailMap 后端接口文档")
                .description("全国旅游地图项目阶段 3 基础接口文档")
                .version("v1.0.1")
                .contact(new Contact().name("TrailMap")));
    }
}
