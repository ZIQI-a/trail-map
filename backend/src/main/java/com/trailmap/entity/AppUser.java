package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 应用用户实体，对应 app_user 表。
 * 用户密码只保存哈希值，后续注册登录接口不得写入明文密码。
 */
@Getter
@Setter
@TableName("app_user")
public class AppUser {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String nickname;
    private String userType;
    private String passwordHash;
    private String avatarUrl;
    private String phone;
    private String email;
    private String region;
    private Integer status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
