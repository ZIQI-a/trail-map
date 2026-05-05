package com.trailmap.controller;

import com.trailmap.common.ApiResponse;
import com.trailmap.model.response.SpotTagResponse;
import com.trailmap.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 标签接口，负责给前端返回当前城市可用的筛选标签。
 */
@Validated
@RestController
@RequestMapping("/api/cities/{cityId}/tags")
@Tag(name = "标签接口")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    /**
     * 只返回当前城市实际有景点命中的标签，减少前端出现空筛选结果的概率。
     */
    @GetMapping
    @Operation(summary = "获取城市景点标签")
    public ApiResponse<List<SpotTagResponse>> listTagsByCity(
            @PathVariable @Positive(message = "城市 ID 必须大于 0") Long cityId
    ) {
        return ApiResponse.success(tagService.listTagsByCity(cityId));
    }
}
