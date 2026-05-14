package com.trailmap;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    @Test
    void shouldReturnBoundaryForAreaSpot() throws Exception {
        mockMvc.perform(get("/api/spots/203"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("大唐不夜城"))
                .andExpect(jsonPath("$.data.boundary.length()").value(0));
    }

    @Test
    void shouldReturnCalibratedXianSpotPosition() throws Exception {
        mockMvc.perform(get("/api/spots/202"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("大雁塔"))
                .andExpect(jsonPath("$.data.position.lng").value(108.964186))
                .andExpect(jsonPath("$.data.position.lat").value(34.218203));
    }

    @Test
    void shouldReturnCalibratedChengduSpotPosition() throws Exception {
        mockMvc.perform(get("/api/spots/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("宽窄巷子"))
                .andExpect(jsonPath("$.data.position.lng").value(104.053572))
                .andExpect(jsonPath("$.data.position.lat").value(30.663689));
    }

    @Test
    void shouldPlanFreeRoute() throws Exception {
        String requestBody = """
                {
                  "cityId": 2,
                  "startPoint": {
                    "name": "西安钟楼酒店",
                    "position": {
                      "lng": 108.947152,
                      "lat": 34.259061
                    }
                  },
                  "spotIds": [201, 202, 203],
                  "transportType": "transit",
                  "planMode": "free"
                }
                """;

        mockMvc.perform(post("/api/routes/plan")
                        .contentType("application/json")
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cityId").value(2))
                .andExpect(jsonPath("$.data.planMode").value("free"))
                .andExpect(jsonPath("$.data.orderedSpotIds.length()").value(3))
                .andExpect(jsonPath("$.data.segments.length()").value(3))
                .andExpect(jsonPath("$.data.totalStayDurationMinutes").value(450))
                .andExpect(jsonPath("$.data.totalTravelDurationSeconds").isNumber())
                .andExpect(jsonPath("$.data.totalTripDurationMinutes").isNumber());
    }

    @Test
    void shouldPlanScheduledItinerary() throws Exception {
        String requestBody = """
                {
                  "cityId": 1,
                  "startPoint": {
                    "name": "春熙路地铁站",
                    "position": {
                      "lng": 104.081757,
                      "lat": 30.657429
                    }
                  },
                  "spotIds": [101, 102, 103, 104],
                  "transportType": "transit",
                  "planMode": "schedule",
                  "tripDays": 2,
                  "dailyStartTime": "09:00",
                  "dailyEndTime": "18:00",
                  "includeLunchBreak": true,
                  "intensity": "standard"
                }
                """;

        mockMvc.perform(post("/api/routes/plan")
                        .contentType("application/json")
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.planMode").value("schedule"))
                .andExpect(jsonPath("$.data.itineraryDays.length()").value(2))
                .andExpect(jsonPath("$.data.itineraryDays[0].spots.length()").isNumber())
                .andExpect(jsonPath("$.data.spotStayPlans[0].suggestedStartTime").exists())
                .andExpect(jsonPath("$.data.spotStayPlans[0].suggestedEndTime").exists())
                .andExpect(jsonPath("$.data.spotStayPlans[0].dayIndex").isNumber());
    }

    @Test
    void shouldRegisterLoginAndReadCurrentUser() throws Exception {
        String registerBody = """
                {
                  "username": "traveler_register",
                  "nickname": "旅行用户",
                  "password": "secret123"
                }
                """;

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registerBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.username").value("traveler_register"))
                .andExpect(jsonPath("$.data.user.userType").value("normal"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String registerToken = JsonPath.read(registerResponse, "$.data.token");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + registerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("traveler_register"));

        String loginBody = """
                {
                  "username": "traveler_register",
                  "password": "secret123"
                }
                """;
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.lastLoginAt").exists());
    }

    @Test
    void shouldRejectCurrentUserWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldCreateUpdateListAndDeleteUser() throws Exception {
        String createBody = """
                {
                  "username": "admin_crud",
                  "nickname": "后台用户",
                  "userType": "admin",
                  "password": "secret123",
                  "email": "admin_crud@example.com"
                }
                """;

        String createResponse = mockMvc.perform(post("/api/users")
                        .contentType("application/json")
                        .content(createBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("admin_crud"))
                .andExpect(jsonPath("$.data.userType").value("admin"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();
        Integer userId = JsonPath.read(createResponse, "$.data.id");

        String updateBody = """
                {
                  "nickname": "后台管理员",
                  "userType": "member",
                  "status": 1
                }
                """;
        mockMvc.perform(put("/api/users/{userId}", userId)
                        .contentType("application/json")
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("后台管理员"))
                .andExpect(jsonPath("$.data.userType").value("member"));

        mockMvc.perform(get("/api/users").param("pageNum", "1").param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paged").value(true));

        mockMvc.perform(delete("/api/users/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/users/{userId}", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
