package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.AdminSpotCreateRequest;
import com.trailmap.model.query.AdminSpotUpdateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.AdminSpotResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.AdminSpotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端景点接口，负责后台维护景点资料和展示状态。
 */
@Validated
@RestController
@RequestMapping("/api/admin/spots")
@Tag(name = "管理端景点接口")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSpotController {

    private final AdminSpotService adminSpotService;

    public AdminSpotController(AdminSpotService adminSpotService) {
        this.adminSpotService = adminSpotService;
    }

    /**
     * 后台查询景点列表，支持城市、关键词、类型和状态筛选。
     */
    @GetMapping
    @Operation(summary = "管理端获取景点列表")
    public ApiResponse<PageResponse<AdminSpotResponse>> listSpots(
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") @Parameter(description = "页号，非必传") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") @Parameter(description = "每页大小，非必传") Integer pageSize,
            @RequestParam(required = false) @Positive(message = "城市 ID 必须大于 0") @Parameter(description = "城市 ID，非必传") Long cityId,
            @RequestParam(required = false) @Parameter(description = "关键词，支持景点名称、摘要、地址") String keyword,
            @RequestParam(required = false) @Parameter(description = "景点类型，例如 history、museum") String type,
            @RequestParam(required = false) @Parameter(description = "状态，1 启用，2 停用") Integer status
    ) {
        return ApiResponse.success(adminSpotService.listSpots(new PageQuery(pageNum, pageSize), cityId, keyword, type, status));
    }

    /**
     * 后台查看单个景点详情，便于编辑弹窗回填。
     */
    @GetMapping("/{spotId}")
    @Operation(summary = "管理端获取景点详情")
    public ApiResponse<AdminSpotResponse> getSpot(@PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(adminSpotService.getSpot(spotId));
    }

    /**
     * 后台新增景点。
     */
    @PostMapping
    @Operation(summary = "管理端新增景点")
    public ApiResponse<AdminSpotResponse> createSpot(@Valid @RequestBody AdminSpotCreateRequest request) {
        return ApiResponse.success(adminSpotService.createSpot(request));
    }

    /**
     * 后台更新景点资料。
     */
    @PutMapping("/{spotId}")
    @Operation(summary = "管理端更新景点")
    public ApiResponse<AdminSpotResponse> updateSpot(
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId,
            @Valid @RequestBody AdminSpotUpdateRequest request
    ) {
        return ApiResponse.success(adminSpotService.updateSpot(spotId, request));
    }

    /**
     * 后台删除景点。当前采用状态位逻辑删除。
     */
    @DeleteMapping("/{spotId}")
    @Operation(summary = "管理端删除景点")
    public ApiResponse<Void> deleteSpot(@PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        adminSpotService.deleteSpot(spotId);
        return ApiResponse.success(null);
    }
}
