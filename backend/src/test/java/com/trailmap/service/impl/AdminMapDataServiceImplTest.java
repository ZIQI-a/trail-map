package com.trailmap.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/**
 * 管理端行政区编码规则测试，防止六位 adcode 被错误过滤。
 */
class AdminMapDataServiceImplTest {

    @Test
    void shouldAcceptStandardSixDigitProvinceCodes() {
        assertTrue(AdminMapDataServiceImpl.isStandardProvinceCode("610000"));
        assertTrue(AdminMapDataServiceImpl.isStandardProvinceCode("620000"));
        assertTrue(AdminMapDataServiceImpl.isStandardProvinceCode("810000"));
    }

    @Test
    void shouldRejectInvalidOrExperimentalProvinceCodes() {
        assertFalse(AdminMapDataServiceImpl.isStandardProvinceCode("61000"));
        assertFalse(AdminMapDataServiceImpl.isStandardProvinceCode("990000"));
        assertFalse(AdminMapDataServiceImpl.isStandardProvinceCode(null));
    }
}
