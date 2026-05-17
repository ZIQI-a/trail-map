package com.trailmap.service;

import com.trailmap.model.response.AdminOverviewResponse;

/**
 * 管理端概览服务，负责聚合后台首页所需统计数据。
 */
public interface AdminOverviewService {

    /**
     * 查询后台首页概览数据。
     */
    AdminOverviewResponse getOverview();
}
