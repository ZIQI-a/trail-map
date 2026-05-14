package com.trailmap.service;

/**
 * 密码哈希服务，负责把明文密码转换为不可逆哈希并做登录校验。
 */
public interface PasswordHashService {

    String hash(String rawPassword);

    boolean matches(String rawPassword, String encodedPassword);
}
