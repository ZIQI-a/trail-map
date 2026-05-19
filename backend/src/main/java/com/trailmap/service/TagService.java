package com.trailmap.service;

import com.trailmap.model.response.SpotTagResponse;
import java.util.List;

/**
 * 标签服务接口，负责前端筛选标签展示。
 */
public interface TagService {

    List<SpotTagResponse> listTagsByCity(Long cityId);

    List<SpotTagResponse> listAllTags();
}
