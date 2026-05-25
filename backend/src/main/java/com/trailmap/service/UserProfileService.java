package com.trailmap.service;

import com.trailmap.model.response.UserProfileOverviewResponse;

/**
 * 个人主页服务，负责聚合用户画像页所需的统计数据。
 */
public interface UserProfileService {

    /**
     * 获取当前登录用户的个人主页概览统计。
     */
    UserProfileOverviewResponse getOverview(Long userId);
}
