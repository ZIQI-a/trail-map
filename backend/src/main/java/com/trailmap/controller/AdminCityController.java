package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.AdminCityCreateRequest;
import com.trailmap.model.query.AdminCityUpdateRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.AdminCityResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.AdminCityService;
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
 * 管理端城市接口，负责后台维护城市基础资料。
 */
@Validated
@RestController
@RequestMapping("/api/admin/cities")
@Tag(name = "管理端城市接口")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCityController {

    private final AdminCityService adminCityService;

    public AdminCityController(AdminCityService adminCityService) {
        this.adminCityService = adminCityService;
    }

    /**
     * 后台查询城市列表，支持分页，默认返回全部城市。
     */
    @GetMapping
    @Operation(summary = "管理端获取城市列表")
    public ApiResponse<PageResponse<AdminCityResponse>> listCities(
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") @Parameter(description = "页号，非必传") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") @Parameter(description = "每页大小，非必传") Integer pageSize
    ) {
        return ApiResponse.success(adminCityService.listCities(new PageQuery(pageNum, pageSize)));
    }

    /**
     * 后台查看城市详情，便于表单回填和资料核对。
     */
    @GetMapping("/{cityId}")
    @Operation(summary = "管理端获取城市详情")
    public ApiResponse<AdminCityResponse> getCity(@PathVariable @Positive(message = "城市 ID 必须大于 0") Long cityId) {
        return ApiResponse.success(adminCityService.getCity(cityId));
    }

    /**
     * 后台新增城市。
     */
    @PostMapping
    @Operation(summary = "管理端新增城市")
    public ApiResponse<AdminCityResponse> createCity(@Valid @RequestBody AdminCityCreateRequest request) {
        return ApiResponse.success(adminCityService.createCity(request));
    }

    /**
     * 后台更新城市资料。
     */
    @PutMapping("/{cityId}")
    @Operation(summary = "管理端更新城市")
    public ApiResponse<AdminCityResponse> updateCity(
            @PathVariable @Positive(message = "城市 ID 必须大于 0") Long cityId,
            @Valid @RequestBody AdminCityUpdateRequest request
    ) {
        return ApiResponse.success(adminCityService.updateCity(cityId, request));
    }

    /**
     * 后台删除城市。当前采用状态位逻辑删除，保留历史可追溯性。
     */
    @DeleteMapping("/{cityId}")
    @Operation(summary = "管理端删除城市")
    public ApiResponse<Void> deleteCity(@PathVariable @Positive(message = "城市 ID 必须大于 0") Long cityId) {
        adminCityService.deleteCity(cityId);
        return ApiResponse.success(null);
    }
}
