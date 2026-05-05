package com.trailmap.controller;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康检查接口，用于验证后端服务是否已经正常启动。
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    /**
     * 返回最小健康状态，后续可扩展数据库、缓存、地图 API 等检查项。
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "trailmap-backend");
    }
}
