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
    void shouldAllowPublicMapApiWithInvalidToken() throws Exception {
        // 登录过期后公开地图数据仍应按匿名用户正常加载。
        mockMvc.perform(get("/api/cities")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void shouldRejectProtectedApiWithInvalidToken() throws Exception {
        // 同一个无效 Token 访问受保护接口时仍必须返回 401。
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldRejectUserManagementWithoutAdminRole() throws Exception {
        String normalUserToken = registerAndLogin("normal_only_user", "普通用户");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + normalUserToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void shouldCreateUpdateListAndDeleteUser() throws Exception {
        String adminToken = promoteRegisteredUserToAdminAndLogin(
                "admin_operator",
                "管理员用户");
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
                        .header("Authorization", "Bearer " + adminToken)
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
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("后台管理员"))
                .andExpect(jsonPath("$.data.userType").value("member"));

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("pageNum", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paged").value(true));

        mockMvc.perform(delete("/api/users/{userId}", userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/users/{userId}", userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldSaveTripAndReturnFullItineraryItems() throws Exception {
        String userToken = registerAndLogin("trip_owner_user", "行程用户");
        String saveBody = """
                {
                  "cityId": 1,
                  "tripName": "成都两日慢游",
                  "startName": "春熙路地铁站",
                  "startPosition": {
                    "lng": 104.081757,
                    "lat": 30.657429
                  },
                  "endName": "宽窄巷子附近酒店",
                  "endPosition": {
                    "lng": 104.053572,
                    "lat": 30.663689
                  },
                  "startDate": "2026-05-20",
                  "endDate": "2026-05-21",
                  "days": 2,
                  "transportType": "transit",
                  "planMode": "schedule",
                  "totalDistance": 9200,
                  "totalTravelDuration": 4200,
                  "totalStayDuration": 360,
                  "totalTripDuration": 430,
                  "items": [
                    {
                      "spotId": 101,
                      "itemName": "宽窄巷子",
                      "itemType": "spot",
                      "dayIndex": 1,
                      "sortOrder": 1,
                      "startTime": "09:00",
                      "endTime": "11:00",
                      "suggestedDuration": 120
                    },
                    {
                      "itemName": "午餐",
                      "itemType": "lunch",
                      "position": {
                        "lng": 104.054000,
                        "lat": 30.664000
                      },
                      "dayIndex": 1,
                      "sortOrder": 2,
                      "startTime": "12:00",
                      "endTime": "13:00",
                      "suggestedDuration": 60
                    }
                  ]
                }
                """;

        String saveResponse = mockMvc.perform(post("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content(saveBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Integer tripId = JsonPath.read(saveResponse, "$.data");

        mockMvc.perform(get("/api/user-trips/{id}", tripId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tripName").value("成都两日慢游"))
                .andExpect(jsonPath("$.data.itineraryDays[0].spots[0].spotName").value("宽窄巷子"))
                .andExpect(jsonPath("$.data.itineraryDays[0].items[1].itemType").value("lunch"))
                .andExpect(jsonPath("$.data.itineraryDays[0].items[1].itemName").value("午餐"))
                .andExpect(jsonPath("$.data.itineraryDays[0].items[1].startTime").value("12:00"))
                .andExpect(jsonPath("$.data.itineraryDays[0].items[1].lng").value(104.054))
                .andExpect(jsonPath("$.data.itineraryDays[0].items[1].lat").value(30.664));
    }

    @Test
    void shouldRejectTripWithCrossCitySpotOrMissingSegmentPosition() throws Exception {
        String userToken = registerAndLogin("trip_invalid_user", "非法行程用户");
        String badBody = """
                {
                  "cityId": 1,
                  "tripName": "非法行程",
                  "startName": "春熙路地铁站",
                  "days": 1,
                  "transportType": "transit",
                  "planMode": "schedule",
                  "items": [
                    {
                      "spotId": 201,
                      "itemName": "陕西历史博物馆",
                      "itemType": "spot",
                      "dayIndex": 1,
                      "sortOrder": 1
                    }
                  ],
                  "segments": [
                    {
                      "dayIndex": 1,
                      "segmentIndex": 0,
                      "fromName": "春熙路地铁站",
                      "toName": "陕西历史博物馆",
                      "transportType": "transit"
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content(badBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldRejectDeletedTripDetail() throws Exception {
        String userToken = registerAndLogin("trip_delete_user", "删除行程用户");
        String saveBody = """
                {
                  "cityId": 1,
                  "tripName": "待删除行程",
                  "days": 1,
                  "transportType": "walk",
                  "planMode": "free",
                  "items": [
                    {
                      "spotId": 101,
                      "itemName": "宽窄巷子",
                      "itemType": "spot",
                      "dayIndex": 1,
                      "sortOrder": 1,
                      "suggestedDuration": 120
                    }
                  ]
                }
                """;

        String saveResponse = mockMvc.perform(post("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content(saveBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        Integer tripId = JsonPath.read(saveResponse, "$.data");

        mockMvc.perform(delete("/api/user-trips/{id}", tripId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/user-trips/{id}", tripId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldFilterAndSortUserTripsFromBackend() throws Exception {
        String userToken = registerAndLogin("trip_query_user", "筛选行程用户");
        String chengduTripBody = """
                {
                  "cityId": 1,
                  "tripName": "成都完整行程",
                  "days": 2,
                  "transportType": "transit",
                  "planMode": "schedule",
                  "items": [
                    {
                      "spotId": 101,
                      "itemName": "宽窄巷子",
                      "itemType": "spot",
                      "dayIndex": 1,
                      "sortOrder": 1
                    }
                  ]
                }
                """;
        String xianTripBody = """
                {
                  "cityId": 2,
                  "tripName": "西安自由路线",
                  "days": 1,
                  "transportType": "walk",
                  "planMode": "free",
                  "items": [
                    {
                      "spotId": 201,
                      "itemName": "陕西历史博物馆",
                      "itemType": "spot",
                      "dayIndex": 1,
                      "sortOrder": 1
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content(chengduTripBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mockMvc.perform(post("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content(xianTripBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .param("planMode", "schedule")
                        .param("cityName", "成都市")
                        .param("sortBy", "city")
                        .param("pageNum", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paged").value(true))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].tripName").value("成都完整行程"))
                .andExpect(jsonPath("$.data.list[0].cityName").value("成都市"))
                .andExpect(jsonPath("$.data.list[0].planMode").value("schedule"));
    }

    @Test
    void shouldReturnUserProfileOverview() throws Exception {
        String userToken = registerAndLogin("profile_overview_user", "主页统计用户");

        mockMvc.perform(post("/api/checkin-spots/101")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "remark": "打卡宽窄巷子"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/user-trips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "cityId": 2,
                                  "tripName": "西安两日游",
                                  "days": 2,
                                  "transportType": "transit",
                                  "planMode": "schedule",
                                  "items": [
                                    {
                                      "spotId": 201,
                                      "itemName": "陕西历史博物馆",
                                      "itemType": "spot",
                                      "dayIndex": 1,
                                      "sortOrder": 1
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/profile/overview")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.favoriteSpotCount").value(0))
                .andExpect(jsonPath("$.data.checkinSpotCount").value(1))
                .andExpect(jsonPath("$.data.tripCount").value(1))
                .andExpect(jsonPath("$.data.totalTravelDays").value(2))
                .andExpect(jsonPath("$.data.visitedCityCount").value(2))
                .andExpect(jsonPath("$.data.recentCityName").value("成都市"));

        mockMvc.perform(get("/api/checkin-spots/footprint")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCheckinCount").value(1))
                .andExpect(jsonPath("$.data.unlockedProvinceCount").value(1))
                .andExpect(jsonPath("$.data.provinces[0].provinceName").value("四川省"))
                .andExpect(jsonPath("$.data.provinces[0].checkinCount").value(1))
                .andExpect(jsonPath("$.data.provinces[0].cityCount").value(1))
                .andExpect(jsonPath("$.data.cities[0].cityName").value("成都市"))
                .andExpect(jsonPath("$.data.cities[0].checkinCount").value(1));
    }

    @Test
    void shouldCheckinListAndCancelSpot() throws Exception {
        String userToken = registerAndLogin("checkin_owner_user", "足迹用户");
        String checkinBody = """
                {
                  "checkinLng": 104.053572,
                  "checkinLat": 30.663689,
                  "remark": "第一次来宽窄巷子"
                }
                """;

        mockMvc.perform(get("/api/checkin-spots/101/status")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedIn").value(false));

        mockMvc.perform(post("/api/checkin-spots/101")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType("application/json")
                        .content(checkinBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.checkedIn").value(true))
                .andExpect(jsonPath("$.data.remark").value("第一次来宽窄巷子"));

        mockMvc.perform(get("/api/checkin-spots")
                        .header("Authorization", "Bearer " + userToken)
                        .param("cityName", "成都市")
                        .param("pageNum", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paged").value(true))
                .andExpect(jsonPath("$.data.list[0].spotId").value(101))
                .andExpect(jsonPath("$.data.list[0].name").value("宽窄巷子"))
                .andExpect(jsonPath("$.data.list[0].checkedInAt").exists())
                .andExpect(jsonPath("$.data.list[0].checkinPosition.lng").value(104.053572))
                .andExpect(jsonPath("$.data.list[0].remark").value("第一次来宽窄巷子"));

        mockMvc.perform(delete("/api/checkin-spots/101")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedIn").value(false));

        mockMvc.perform(get("/api/checkin-spots/101/status")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedIn").value(false));
    }

    @Test
    void shouldRejectCheckinWithoutToken() throws Exception {
        mockMvc.perform(post("/api/checkin-spots/101")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    /**
     * 测试里复用正常注册流程拿 token，避免手写不一致的密码哈希。
     */
    private String registerAndLogin(String username, String nickname) throws Exception {
        String registerBody = """
                {
                  "username": "%s",
                  "nickname": "%s",
                  "password": "secret123"
                }
                """.formatted(username, nickname);

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registerBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(registerResponse, "$.data.token");
    }

    /**
     * 当前正式注册入口只允许 normal 用户，测试通过数据库提升角色来模拟已存在管理员账号。
     */
    private String promoteRegisteredUserToAdminAndLogin(String username, String nickname) throws Exception {
        registerAndLogin(username, nickname);
        jdbcTemplate.update(
                "update app_user set user_type = 'admin', updated_at = CURRENT_TIMESTAMP where username = ?",
                username);

        String loginBody = """
                {
                  "username": "%s",
                  "password": "secret123"
                }
                """.formatted(username);
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.userType").value("admin"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(loginResponse, "$.data.token");
    }
}
