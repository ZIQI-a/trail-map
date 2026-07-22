package com.trailmap.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.trailmap.common.ErrorCode;
import com.trailmap.entity.AppUser;
import com.trailmap.enums.UserType;
import com.trailmap.exception.BusinessException;
import com.trailmap.exception.UnauthorizedException;
import com.trailmap.mapper.AppUserMapper;
import com.trailmap.model.query.PageQuery;
import com.trailmap.model.query.UserCreateRequest;
import com.trailmap.model.query.UserProfileUpdateRequest;
import com.trailmap.model.query.UserUpdateRequest;
import com.trailmap.model.response.AppUserResponse;
import com.trailmap.model.response.PageResponse;
import com.trailmap.service.AppUserService;
import com.trailmap.service.PasswordHashService;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 用户服务实现，集中处理唯一性校验、密码哈希和逻辑删除。
 */
@Service
public class AppUserServiceImpl implements AppUserService {

    private static final int STATUS_DELETED = 0;
    private static final int STATUS_ENABLED = 1;

    private final AppUserMapper appUserMapper;
    private final PasswordHashService passwordHashService;

    public AppUserServiceImpl(AppUserMapper appUserMapper, PasswordHashService passwordHashService) {
        this.appUserMapper = appUserMapper;
        this.passwordHashService = passwordHashService;
    }

    @Override
    public PageResponse<AppUserResponse> listUsers(PageQuery pageQuery, String keyword, String userType, Integer status) {
        LambdaQueryWrapper<AppUser> queryWrapper = new LambdaQueryWrapper<AppUser>()
                .ne(AppUser::getStatus, STATUS_DELETED)
                .orderByDesc(AppUser::getCreatedAt);
        if (StringUtils.hasText(keyword)) {
            String normalizedKeyword = keyword.trim();
            queryWrapper.and(wrapper -> wrapper
                    .like(AppUser::getUsername, normalizedKeyword)
                    .or()
                    .like(AppUser::getNickname, normalizedKeyword)
                    .or()
                    .like(AppUser::getPhone, normalizedKeyword)
                    .or()
                    .like(AppUser::getEmail, normalizedKeyword));
        }
        if (StringUtils.hasText(userType)) {
            queryWrapper.eq(AppUser::getUserType, normalizeUserType(userType));
        }
        if (status != null) {
            queryWrapper.eq(AppUser::getStatus, status);
        }

        if (!pageQuery.isPaged()) {
            return PageResponse.unpaged(appUserMapper.selectList(queryWrapper).stream()
                    .map(this::toResponse)
                    .toList());
        }

        Page<AppUser> page = appUserMapper.selectPage(
                new Page<>(pageQuery.resolvedPageNum(), pageQuery.resolvedPageSize()),
                queryWrapper);
        return PageResponse.paged(page.getRecords().stream()
                .map(this::toResponse)
                .toList(), page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public AppUserResponse getUser(Long userId) {
        return toResponse(loadExistingUser(userId));
    }

    @Override
    public AppUserResponse createUser(UserCreateRequest request) {
        validateUniqueFields(null, request.username(), request.phone(), request.email());

        LocalDateTime now = LocalDateTime.now();
        AppUser user = new AppUser();
        user.setUsername(request.username().trim());
        user.setNickname(request.nickname().trim());
        user.setUserType(normalizeUserType(request.userType()));
        user.setPasswordHash(passwordHashService.hash(request.password()));
        user.setAvatarUrl(normalizeBlank(request.avatarUrl()));
        user.setPhone(normalizeBlank(request.phone()));
        user.setEmail(normalizeBlank(request.email()));
        user.setRegion(normalizeBlank(request.region()));
        user.setStatus(request.status() == null ? STATUS_ENABLED : request.status());
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        appUserMapper.insert(user);
        return toResponse(user);
    }

    @Override
    public AppUserResponse updateUser(Long userId, UserUpdateRequest request) {
        // 管理员需要能够读取并重新启用停用账号，因此这里只排除已删除用户。
        AppUser user = loadExistingUser(userId);
        validateUniqueFields(userId, null, request.phone(), request.email());

        if (StringUtils.hasText(request.nickname())) {
            user.setNickname(request.nickname().trim());
        }
        if (request.userType() != null) {
            user.setUserType(normalizeUserType(request.userType()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(normalizeBlank(request.avatarUrl()));
        }
        if (request.phone() != null) {
            user.setPhone(normalizeBlank(request.phone()));
        }
        if (request.email() != null) {
            user.setEmail(normalizeBlank(request.email()));
        }
        if (request.region() != null) {
            user.setRegion(normalizeBlank(request.region()));
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        user.setUpdatedAt(LocalDateTime.now());
        appUserMapper.updateById(user);
        return toResponse(user);
    }

    @Override
    public AppUserResponse updateCurrentUserProfile(Long userId, UserProfileUpdateRequest request) {
        AppUser user = loadActiveUser(userId);
        validateUniqueFields(userId, null, request.phone(), request.email());

        if (request.nickname() != null) {
            user.setNickname(normalizeBlank(request.nickname()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(normalizeBlank(request.avatarUrl()));
        }
        if (request.phone() != null) {
            user.setPhone(normalizeBlank(request.phone()));
        }
        if (request.email() != null) {
            user.setEmail(normalizeBlank(request.email()));
        }
        if (request.region() != null) {
            user.setRegion(normalizeBlank(request.region()));
        }
        user.setUpdatedAt(LocalDateTime.now());
        appUserMapper.updateById(user);
        return toResponse(user);
    }

    @Override
    public void deleteUser(Long userId) {
        AppUser user = loadExistingUser(userId);
        user.setStatus(STATUS_DELETED);
        user.setUpdatedAt(LocalDateTime.now());
        appUserMapper.updateById(user);
    }

    /**
     * 认证链路只接受启用账号，确保后台停用后已有 Token 立即失效。
     */
    public AppUser loadActiveUser(Long userId) {
        AppUser user = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getId, userId)
                .eq(AppUser::getStatus, STATUS_ENABLED)
                .last("limit 1"));
        if (user == null) {
            throw new UnauthorizedException("账号不存在或已停用，请重新登录");
        }
        return user;
    }

    /**
     * 后台管理链路允许访问启用或停用账号，但不允许操作已逻辑删除账号。
     */
    private AppUser loadExistingUser(Long userId) {
        AppUser user = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getId, userId)
                .ne(AppUser::getStatus, STATUS_DELETED)
                .last("limit 1"));
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在或已删除");
        }
        return user;
    }

    public AppUserResponse toResponse(AppUser user) {
        return new AppUserResponse(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getUserType(),
                user.getAvatarUrl(),
                user.getPhone(),
                user.getEmail(),
                user.getRegion(),
                user.getStatus(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    private void validateUniqueFields(Long currentUserId, String username, String phone, String email) {
        if (StringUtils.hasText(username) && existsByField(currentUserId, "username", username.trim())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "用户名已存在");
        }
        if (StringUtils.hasText(phone) && existsByField(currentUserId, "phone", phone.trim())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "手机号已被使用");
        }
        if (StringUtils.hasText(email) && existsByField(currentUserId, "email", email.trim())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "邮箱已被使用");
        }
    }

    private boolean existsByField(Long currentUserId, String fieldName, String fieldValue) {
        LambdaQueryWrapper<AppUser> queryWrapper = new LambdaQueryWrapper<AppUser>()
                .ne(AppUser::getStatus, STATUS_DELETED)
                .eq("username".equals(fieldName), AppUser::getUsername, fieldValue)
                .eq("phone".equals(fieldName), AppUser::getPhone, fieldValue)
                .eq("email".equals(fieldName), AppUser::getEmail, fieldValue);
        if (currentUserId != null) {
            queryWrapper.ne(AppUser::getId, currentUserId);
        }
        return appUserMapper.selectCount(queryWrapper) > 0;
    }

    private String normalizeUserType(String userType) {
        try {
            return UserType.normalizeOrDefault(userType);
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
