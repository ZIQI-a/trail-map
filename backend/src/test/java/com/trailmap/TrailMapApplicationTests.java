package com.trailmap;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 应用集成测试，确保阶段 3 的基础接口契约可以正常工作。
 */
@SpringBootTest
@AutoConfigureMockMvc
class TrailMapApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void contextLoads() {
        // 空测试即可触发 Spring 上下文加载，确保应用基础配置完整。
    }

    @Test
    void shouldLoadSeedDataIntoDatabase() {
        Integer cityCount = jdbcTemplate.queryForObject("select count(*) from city", Integer.class);
        Integer spotCount = jdbcTemplate.queryForObject("select count(*) from spot", Integer.class);
        assertTrue(cityCount != null && cityCount > 0);
        assertTrue(spotCount != null && spotCount > 0);
    }

    @Test
    void shouldListCities() throws Exception {
        mockMvc.perform(get("/api/cities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paged").value(false))
                .andExpect(jsonPath("$.data.list[0].name").value("成都市"));
    }

    @Test
    void shouldPageCitiesWhenPageParamsProvided() throws Exception {
        mockMvc.perform(get("/api/cities").param("pageNum", "1").param("pageSize", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paged").value(true))
                .andExpect(jsonPath("$.data.pageNum").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(1))
                .andExpect(jsonPath("$.data.list.length()").value(1));
    }

    @Test
    void shouldFilterSpotsByTag() throws Exception {
        mockMvc.perform(get("/api/cities/1/spots").param("tagCode", "subway"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paged").value(false))
                .andExpect(jsonPath("$.data.list[0].tags[0].code").exists());
    }

    @Test
    void shouldPageSpotsWhenPageParamsProvided() throws Exception {
        mockMvc.perform(get("/api/cities/1/spots").param("pageNum", "1").param("pageSize", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paged").value(true))
                .andExpect(jsonPath("$.data.pageSize").value(2))
                .andExpect(jsonPath("$.data.list.length()").value(2));
    }

    @Test
    void shouldReturnSpotDetail() throws Exception {
        mockMvc.perform(get("/api/spots/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("宽窄巷子"))
                .andExpect(jsonPath("$.data.tags.length()").value(4));
    }
}
