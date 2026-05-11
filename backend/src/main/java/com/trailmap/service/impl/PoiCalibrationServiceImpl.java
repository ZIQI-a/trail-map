package com.trailmap.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.config.BaiduMapProperties;
import com.trailmap.exception.BusinessException;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.model.response.PoiCalibrationCandidateResponse;
import com.trailmap.service.PoiCalibrationService;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 百度地点检索实现，当前用于给精选景点找更精确的主点位和导航引导点。
 */
@Service
public class PoiCalibrationServiceImpl implements PoiCalibrationService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final BaiduMapProperties baiduMapProperties;
    private final RestClient restClient;

    public PoiCalibrationServiceImpl(BaiduMapProperties baiduMapProperties) {
        this.baiduMapProperties = baiduMapProperties;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public List<PoiCalibrationCandidateResponse> searchCandidates(String cityName, String keyword, String addressKeyword) {
        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "未配置百度地图服务端 AK，无法执行 POI 校准检索");
        }

        String query = buildQuery(keyword, addressKeyword);
        String responseText = requestCandidates(cityName, query);

        return parseCandidates(responseText);
    }

    @Override
    public List<PoiCalibrationCandidateResponse> searchNearbyCandidates(String cityName, CoordinateResponse center, String keyword, int radiusMeters) {
        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "未配置百度地图服务端 AK，无法执行附近地点检索");
        }

        try {
            String responseText = restClient.get()
                    .uri(UriComponentsBuilder.fromHttpUrl(baiduMapProperties.getPlaceSearchUrl())
                            .queryParam("query", keyword.trim())
                            .queryParam("location", center.lat() + "," + center.lng())
                            .queryParam("radius", Math.max(300, radiusMeters))
                            .queryParam("radius_limit", true)
                            .queryParam("output", "json")
                            .queryParam("scope", 2)
                            .queryParam("page_size", 5)
                            .queryParam("ret_coordtype", "gcj02ll")
                            .queryParam("ak", baiduMapProperties.getServerAk())
                            .build()
                            .encode()
                            .toUri())
                    .retrieve()
                    .body(String.class);
            return parseCandidates(responseText);
        } catch (Exception exception) {
            // 部分环境或关键词下附近检索可能失败，这里回退到城市维度检索，优先保证推荐流程可用。
            return searchCandidates(cityName, keyword, null);
        }
    }

    private String buildQuery(String keyword, String addressKeyword) {
        if (!StringUtils.hasText(addressKeyword)) {
            return keyword.trim();
        }
        // 地址关键词只作为辅助召回条件拼进 query，仍由人工确认最终候选项。
        return keyword.trim() + " " + addressKeyword.trim();
    }

    /**
     * 调用百度地点检索接口。
     * 第三方请求失败时转成业务异常，避免直接冒泡成 500。
     */
    private String requestCandidates(String cityName, String query) {
        try {
            return restClient.get()
                    .uri(UriComponentsBuilder.fromHttpUrl(baiduMapProperties.getPlaceSearchUrl())
                            .queryParam("query", query)
                            .queryParam("region", cityName)
                            .queryParam("city_limit", true)
                            .queryParam("output", "json")
                            .queryParam("scope", 2)
                            .queryParam("page_size", 5)
                            .queryParam("ret_coordtype", "gcj02ll")
                            .queryParam("ak", baiduMapProperties.getServerAk())
                            // query 和 region 可能包含中文，必须在这里交给 Spring 做编码，
                            // 不能用 build(true) 假定参数已编码，否则会直接抛 Invalid character。
                            .build()
                            .encode()
                            .toUri())
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "百度地点检索调用失败，请稍后重试");
        }
    }

    private List<PoiCalibrationCandidateResponse> parseCandidates(String responseText) {
        try {
            JsonNode root = OBJECT_MAPPER.readTree(responseText);
            if (root.path("status").asInt() != 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "百度地点检索失败: " + root.path("message").asText("unknown error"));
            }

            return StreamSupport.stream(root.path("results").spliterator(), false)
                    .map(this::toCandidateResponse)
                    .toList();
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "解析百度地点检索结果失败");
        }
    }

    private PoiCalibrationCandidateResponse toCandidateResponse(JsonNode item) {
        return new PoiCalibrationCandidateResponse(
                item.path("name").asText(),
                item.path("uid").asText(),
                item.path("address").asText(),
                item.path("province").asText(),
                item.path("city").asText(),
                item.path("area").asText(),
                toCoordinate(item.path("location")),
                toCoordinate(item.path("detail_info").path("navi_location")),
                item.path("detail_info").path("detail_url").asText(),
                "baidu"
        );
    }

    private CoordinateResponse toCoordinate(JsonNode locationNode) {
        if (!locationNode.isObject() || locationNode.path("lng").isMissingNode() || locationNode.path("lat").isMissingNode()) {
            return null;
        }

        return new CoordinateResponse(
                new BigDecimal(locationNode.path("lng").asText()),
                new BigDecimal(locationNode.path("lat").asText())
        );
    }
}
