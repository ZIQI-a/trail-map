package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.query.CheckinSpotQuery;
import com.trailmap.model.query.CheckinSpotRequest;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.response.CheckinSpotItemResponse;
import com.trailmap.model.response.CheckinSpotStatusResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.security.AuthUserPrincipal;
import com.trailmap.service.CheckinSpotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 打卡景点接口，供地图工作台和后续“我的足迹”页面使用。
 */
@Validated
@RestController
@RequestMapping("/api/checkin-spots")
@Tag(name = "打卡景点接口")
public class CheckinSpotController {

    private final CheckinSpotService checkinSpotService;

    public CheckinSpotController(CheckinSpotService checkinSpotService) {
        this.checkinSpotService = checkinSpotService;
    }

    /**
     * 获取当前用户打卡过的景点列表，供“我的足迹”页面展示。
     */
    @GetMapping
    @Operation(summary = "获取我的打卡景点列表")
    public ApiResponse<PageResponse<CheckinSpotItemResponse>> listCheckinSpots(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) String tagCode,
            @RequestParam(required = false) String cityName,
            @RequestParam(required = false) @Positive(message = "打卡天数必须大于 0") Integer checkedInWithinDays,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) @Positive(message = "页号必须大于 0") Integer pageNum,
            @RequestParam(required = false) @Positive(message = "每页大小必须大于 0") Integer pageSize) {
        return ApiResponse.success(checkinSpotService.listCheckinSpots(
                principal.userId(),
                new CheckinSpotQuery(tagCode, cityName, checkedInWithinDays, sortBy),
                new PageQuery(pageNum, pageSize)));
    }

    /**
     * 获取当前用户对某个景点的打卡状态。
     */
    @GetMapping("/{spotId}/status")
    @Operation(summary = "获取景点打卡状态")
    public ApiResponse<CheckinSpotStatusResponse> getCheckinStatus(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(checkinSpotService.getCheckinStatus(principal.userId(), spotId));
    }

    /**
     * 打卡指定景点；重复打卡会更新备注和可选坐标，不创建重复记录。
     */
    @PostMapping("/{spotId}")
    @Operation(summary = "打卡景点")
    public ApiResponse<CheckinSpotStatusResponse> checkinSpot(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId,
            @RequestBody(required = false) @Valid CheckinSpotRequest request) {
        CheckinSpotRequest safeRequest = request == null ? new CheckinSpotRequest(null, null, null) : request;
        return ApiResponse.success(checkinSpotService.checkinSpot(principal.userId(), spotId, safeRequest));
    }

    /**
     * 取消打卡指定景点；若原本未打卡，也按成功处理。
     */
    @DeleteMapping("/{spotId}")
    @Operation(summary = "取消打卡景点")
    public ApiResponse<CheckinSpotStatusResponse> uncheckinSpot(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable @Positive(message = "景点 ID 必须大于 0") Long spotId) {
        return ApiResponse.success(checkinSpotService.uncheckinSpot(principal.userId(), spotId));
    }
}
