package com.trailmap.service.impl;

import com.trailmap.mapper.UserProfileMapper;
import com.trailmap.model.response.UserProfileOverviewResponse;
import com.trailmap.service.UserProfileService;
import org.springframework.stereotype.Service;

/**
 * 个人主页概览服务实现，统计逻辑统一放在后端，避免前端依赖当前页数据自行计数。
 */
@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileMapper userProfileMapper;

    public UserProfileServiceImpl(UserProfileMapper userProfileMapper) {
        this.userProfileMapper = userProfileMapper;
    }

    @Override
    public UserProfileOverviewResponse getOverview(Long userId) {
        // 个人主页概览统一走 Mapper 聚合，避免 Service 直接维护原生 SQL 字符串。
        return userProfileMapper.selectUserProfileOverview(userId);
    }
}
