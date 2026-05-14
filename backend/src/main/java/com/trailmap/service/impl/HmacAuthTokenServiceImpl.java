package com.trailmap.service.impl;

import com.trailmap.exception.UnauthorizedException;
import com.trailmap.service.AuthTokenService;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 轻量 HMAC Token 实现，避免当前阶段直接引入完整认证框架。
 * Token 只保存用户 ID 和过期时间，签名用于防止客户端篡改。
 */
@Service
public class HmacAuthTokenServiceImpl implements AuthTokenService {

    private static final String TOKEN_PREFIX = "Bearer ";
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final long TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

    private final String tokenSecret;

    public HmacAuthTokenServiceImpl(@Value("${trailmap.auth.token-secret:trailmap-dev-secret}") String tokenSecret) {
        this.tokenSecret = tokenSecret;
    }

    @Override
    public String issueToken(Long userId) {
        long expiresAt = Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS;
        String payload = userId + ":" + expiresAt;
        String encodedPayload = base64Url(payload);
        return encodedPayload + "." + sign(encodedPayload);
    }

    @Override
    public Long verifyToken(String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith(TOKEN_PREFIX)) {
                throw new UnauthorizedException("请先登录");
            }

            String token = authorizationHeader.substring(TOKEN_PREFIX.length()).trim();
            String[] parts = token.split("\\.");
            if (parts.length != 2 || !sign(parts[0]).equals(parts[1])) {
                throw new UnauthorizedException("登录状态无效，请重新登录");
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String[] payloadParts = payload.split(":");
            if (payloadParts.length != 2) {
                throw new UnauthorizedException("登录状态无效，请重新登录");
            }

            long expiresAt = Long.parseLong(payloadParts[1]);
            if (expiresAt < Instant.now().getEpochSecond()) {
                throw new UnauthorizedException("登录已过期，请重新登录");
            }
            return Long.parseLong(payloadParts[0]);
        } catch (UnauthorizedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new UnauthorizedException("登录状态无效，请重新登录");
        }
    }

    private String base64Url(String value) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String encodedPayload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(encodedPayload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new UnauthorizedException("登录状态校验失败");
        }
    }
}
