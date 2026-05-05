package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.SpotQuery;
import com.trailmap.model.response.PageResponse;
import com.trailmap.model.response.SpotDetailResponse;
import com.trailmap.model.response.SpotSummaryResponse;
import com.trailmap.service.SpotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 景点接口，负责地图点位、景点列表和景点详情的基础查询。
 */
@Validated
@RestController
@Tag(name = "景点接口")
public class SpotController {

    private final SpotService spotService;

    public SpotController(SpotService spotService) {
        this.spotService = spotService;
    }

    /**
     * 按城市返回景点列表，并支持关键词、类型和标签筛选。
     */
    @GetMapping("/api/cities/{cityId}/spots")
    @Operation(summary = "获取城市景点列表")
    public ApiResponse<PageResponse<SpotSummaryResponse>> listSpotsByCity(
            @PathVariable @Positive(message = "城市 ID 必须大于 0") Long cityId,
            @RequestParam(required = false) @Parameter(description = "关键词，支持景点名、摘要、地址模糊搜索") String keyword,
            @RequestParam(required = false) @Parameter(description = "景点类型，例如 history、museum") String type,
            @RequestParam(required = false) @Parameter(description = "标签编码，例如 first_visit、subway") String tagCode,
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") @Parameter(description = "页号，非必传") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") @Parameter(description = "每页大小，非必传") Integer pageSize
    ) {
        return ApiResponse.success(spotService.listSpotsByCity(cityId, new SpotQuery(keyword, type, tagCode), new PageQuery(pageNum, pageSize)));
    }

    /**
     * 返回单个景点详情，供右侧详情面板或详情页展示。
     */
    @GetMapping("/api/spots/{spotId}")
    @Operation(summary = "获取景点详情")
    public ApiResponse<SpotDetailResponse> getSpot(@PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(spotService.getSpot(spotId));
    }
}
