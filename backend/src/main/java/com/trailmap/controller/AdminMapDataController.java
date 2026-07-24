package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.response.AdminCityLocationResponse;
import com.trailmap.model.response.AdminCityOptionResponse;
import com.trailmap.model.response.AdminProvinceOptionResponse;
import com.trailmap.model.response.PoiCalibrationCandidateResponse;
import com.trailmap.service.AdminMapDataService;
import com.trailmap.service.PoiCalibrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端地图资料接口，只向管理员提供行政区和景点候选查询能力。
 */
@Validated
@RestController
@RequestMapping("/api/admin/map-data")
@Tag(name = "管理端地图资料接口")
public class AdminMapDataController {

    private final AdminMapDataService adminMapDataService;
    private final PoiCalibrationService poiCalibrationService;

    public AdminMapDataController(
            AdminMapDataService adminMapDataService,
            PoiCalibrationService poiCalibrationService) {
        this.adminMapDataService = adminMapDataService;
        this.poiCalibrationService = poiCalibrationService;
    }

    @GetMapping("/provinces")
    @Operation(summary = "查询省级行政区候选")
    public ApiResponse<List<AdminProvinceOptionResponse>> listProvinces(
            @RequestParam(required = false)
            @Size(max = 20, message = "省份关键词最多 20 个字符")
            String keyword) {
        return ApiResponse.success(adminMapDataService.listProvinces(keyword));
    }

    @GetMapping("/cities")
    @Operation(summary = "查询指定省份下的城市候选")
    public ApiResponse<List<AdminCityOptionResponse>> listCities(
            @RequestParam
            @Pattern(regexp = "\\d{6}", message = "省份编码格式不正确")
            String provinceCode,
            @RequestParam(required = false)
            @Size(max = 20, message = "城市关键词最多 20 个字符")
            String keyword) {
        return ApiResponse.success(adminMapDataService.listCities(provinceCode, keyword));
    }

    @GetMapping("/city-suggestions")
    @Operation(summary = "按省份或城市名称搜索城市候选")
    public ApiResponse<List<AdminCityOptionResponse>> searchCities(
            @RequestParam
            @NotBlank(message = "搜索关键词不能为空")
            @Size(min = 1, max = 20, message = "搜索关键词需要 1 到 20 个字符")
            String keyword) {
        return ApiResponse.success(adminMapDataService.searchCities(keyword));
    }

    @GetMapping("/city-location")
    @Operation(summary = "解析城市编码和中心点")
    public ApiResponse<AdminCityLocationResponse> resolveCity(
            @RequestParam
            @Pattern(regexp = "\\d{6}", message = "省份编码格式不正确")
            String provinceCode,
            @RequestParam
            @Pattern(regexp = "\\d{6}", message = "城市编码格式不正确")
            String cityCode) {
        return ApiResponse.success(adminMapDataService.resolveCity(provinceCode, cityCode));
    }

    @GetMapping("/spot-candidates")
    @Operation(summary = "按城市查询景点候选")
    public ApiResponse<List<PoiCalibrationCandidateResponse>> searchSpotCandidates(
            @RequestParam
            @NotBlank(message = "城市名不能为空")
            @Size(max = 50, message = "城市名最多 50 个字符")
            @Parameter(description = "已选城市名称，例如 南京市")
            String cityName,
            @RequestParam
            @NotBlank(message = "景点名不能为空")
            @Size(min = 2, max = 100, message = "景点关键词需要 2 到 100 个字符")
            String keyword) {
        return ApiResponse.success(poiCalibrationService.searchCandidates(cityName, keyword, null));
    }
}
