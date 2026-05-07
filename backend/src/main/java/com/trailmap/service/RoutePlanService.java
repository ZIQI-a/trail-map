package com.trailmap.service;

import com.trailmap.model.query.RoutePlanRequest;
import com.trailmap.model.response.RoutePlanResponse;

/**
 * 行程规划服务，负责把景点池、交通方式和地图路线能力组合成可直接展示的行程结果。
 */
public interface RoutePlanService {

    /**
     * 生成一份自由路线/完整行程通用的规划结果。
     */
    RoutePlanResponse plan(RoutePlanRequest request);
}
