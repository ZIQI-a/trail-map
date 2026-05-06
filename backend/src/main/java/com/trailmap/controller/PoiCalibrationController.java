package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.response.PoiCalibrationCandidateResponse;
import com.trailmap.service.PoiCalibrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * POI 校准接口，给开发和运营阶段提供更准确的候选点位查询能力。
 */
@Validated
@RestController
@Tag(name = "POI 校准接口")
public class PoiCalibrationController {

    private final PoiCalibrationService poiCalibrationService;

    public PoiCalibrationController(PoiCalibrationService poiCalibrationService) {
        this.poiCalibrationService = poiCalibrationService;
    }

    @GetMapping("/api/poi-calibration/candidates")
    @Operation(summary = "获取景点 POI 校准候选项")
    public ApiResponse<List<PoiCalibrationCandidateResponse>> searchCandidates(
            @RequestParam @NotBlank(message = "城市名不能为空") @Parameter(description = "城市名，例如 西安市") String cityName,
            @RequestParam @NotBlank(message = "景点名不能为空") @Parameter(description = "景点名，例如 大唐不夜城") String keyword,
            @RequestParam(required = false) @Parameter(description = "地址关键词，可选，用于提高召回精度") String addressKeyword
    ) {
        return ApiResponse.success(poiCalibrationService.searchCandidates(cityName, keyword, addressKeyword));
    }
}
