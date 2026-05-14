package com.trailmap.service.impl;

import com.trailmap.common.ErrorCode;
import com.trailmap.exception.BusinessException;
import com.trailmap.service.PasswordHashService;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.stereotype.Service;

/**
 * 基于 JDK PBKDF2 的密码哈希实现，不额外引入安全框架依赖。
 * 存储格式为 pbkdf2$迭代次数$salt$hash，便于后续平滑升级算法。
 */
@Service
public class Pbkdf2PasswordHashServiceImpl implements PasswordHashService {

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 120_000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_LENGTH_BITS = 256;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    public String hash(String rawPassword) {
        byte[] salt = new byte[SALT_BYTES];
        SECURE_RANDOM.nextBytes(salt);
        byte[] passwordHash = pbkdf2(rawPassword, salt, ITERATIONS);
        return "pbkdf2$" + ITERATIONS + "$"
                + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(passwordHash);
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }

        try {
            String[] parts = encodedPassword.split("\\$");
            if (parts.length != 4 || !"pbkdf2".equals(parts[0])) {
                return false;
            }

            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[3]);
            byte[] actualHash = pbkdf2(rawPassword, salt, iterations);
            return constantTimeEquals(expectedHash, actualHash);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private byte[] pbkdf2(String rawPassword, byte[] salt, int iterations) {
        try {
            KeySpec spec = new PBEKeySpec(rawPassword.toCharArray(), salt, iterations, KEY_LENGTH_BITS);
            return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "密码加密失败");
        }
    }

    /**
     * 常量时间比较避免通过响应时间推测哈希内容。
     */
    private boolean constantTimeEquals(byte[] expectedHash, byte[] actualHash) {
        if (expectedHash.length != actualHash.length) {
            return false;
        }

        int diff = 0;
        for (int index = 0; index < expectedHash.length; index += 1) {
            diff |= expectedHash[index] ^ actualHash[index];
        }
        return diff == 0;
    }
}
