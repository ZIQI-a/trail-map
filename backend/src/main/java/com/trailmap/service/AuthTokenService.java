package com.trailmap.service;

/**
 * 登录令牌服务，当前提供轻量 Bearer Token 生成和解析能力。
 */
public interface AuthTokenService {

    String issueToken(Long userId);

    Long verifyToken(String authorizationHeader);
}
