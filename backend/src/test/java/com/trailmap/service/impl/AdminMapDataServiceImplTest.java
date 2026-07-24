package com.trailmap.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.trailmap.config.BaiduMapProperties;
import com.trailmap.model.response.AdminCityOptionResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

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

    @Test
    void shouldReturnProvinceCitiesForCombinedSearch() {
        MockServiceFixture fixture = createFixture();
        fixture.server().expect(request -> assertTrue(
                        request.getURI().getRawQuery().contains("keyword=%E5%9B%9B%E5%B7%9D")))
                .andRespond(withSuccess(SICHUAN_REGION_RESPONSE, MediaType.APPLICATION_JSON));

        List<AdminCityOptionResponse> results = fixture.service().searchCities("四川");

        assertEquals(2, results.size());
        assertEquals("成都市", results.get(0).name());
        assertEquals("四川省", results.get(0).provinceName());
        fixture.server().verify();
    }

    @Test
    void shouldRecognizeProvinceCodeWhenListingCities() {
        MockServiceFixture fixture = createFixture();
        fixture.server().expect(request -> assertTrue(
                        request.getURI().getRawQuery().contains("keyword=%E4%B8%AD%E5%9B%BD")))
                .andRespond(withSuccess(CHINA_REGION_RESPONSE, MediaType.APPLICATION_JSON));
        fixture.server().expect(request -> assertTrue(
                        request.getURI().getRawQuery().contains("keyword=510000")))
                .andRespond(withSuccess(SICHUAN_REGION_RESPONSE, MediaType.APPLICATION_JSON));

        List<AdminCityOptionResponse> results =
                fixture.service().listCities("510000", null);

        assertEquals(2, results.size());
        assertEquals("510100", results.get(0).code());
        fixture.server().verify();
    }

    /**
     * 创建隔离的百度行政区 Mock 服务，避免单元测试依赖真实网络和 AK。
     */
    private MockServiceFixture createFixture() {
        BaiduMapProperties properties = new BaiduMapProperties();
        properties.setServerAk("test-ak");
        properties.setRegionSearchUrl("https://maps.test/regions");
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        return new MockServiceFixture(
                new AdminMapDataServiceImpl(properties, builder.build()),
                server);
    }

    private static final String CHINA_REGION_RESPONSE = """
            {
              "status": 0,
              "districts": [{
                "name": "中华人民共和国",
                "code": "0",
                "level": 0,
                "districts": [{
                  "name": "四川省",
                  "code": "510000",
                  "level": 1,
                  "districts": []
                }]
              }]
            }
            """;

    private static final String SICHUAN_REGION_RESPONSE = """
            {
              "status": 0,
              "districts": [{
                "name": "四川省",
                "code": "510000",
                "level": 1,
                "districts": [
                  {"name": "成都市", "code": "510100", "level": 2},
                  {"name": "自贡市", "code": "510300", "level": 2}
                ]
              }]
            }
            """;

    private record MockServiceFixture(
            AdminMapDataServiceImpl service,
            MockRestServiceServer server) {
    }
}
