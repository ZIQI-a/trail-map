package com.trailmap.service;

import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.UserCreateRequest;
import com.trailmap.model.query.UserUpdateRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.PageResponse;

/**
 * 用户服务，负责用户增删改查和用户资料响应转换。
 */
public interface AppUserService {

    PageResponse<AppUserResponse> listUsers(PageQuery pageQuery, String keyword, String userType, Integer status);

    AppUserResponse getUser(Long userId);

    AppUserResponse createUser(UserCreateRequest request);

    AppUserResponse updateUser(Long userId, UserUpdateRequest request);

    void deleteUser(Long userId);
}
