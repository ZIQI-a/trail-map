package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.response.AdminOverviewResponse;
import com.trailmap.service.AdminOverviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端概览接口，负责后台首页统计数据聚合。
 */
@RestController
@RequestMapping("/api/admin/overview")
@Tag(name = "管理端概览接口")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOverviewController {

    private final AdminOverviewService adminOverviewService;

    public AdminOverviewController(AdminOverviewService adminOverviewService) {
        this.adminOverviewService = adminOverviewService;
    }

    /**
     * 获取后台首页概览数据。
     */
    @GetMapping
    @Operation(summary = "获取管理端数据概览")
    public ApiResponse<AdminOverviewResponse> getOverview() {
        return ApiResponse.success(adminOverviewService.getOverview());
    }
}
