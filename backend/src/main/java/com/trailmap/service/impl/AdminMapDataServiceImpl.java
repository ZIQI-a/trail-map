package com.trailmap.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailmap.common.ErrorCode;
import com.trailmap.config.BaiduMapProperties;
import com.trailmap.exception.BusinessException;
import com.trailmap.model.response.AdminCityLocationResponse;
import com.trailmap.model.response.AdminCityOptionResponse;
import com.trailmap.model.response.AdminProvinceOptionResponse;
import com.trailmap.model.response.CoordinateResponse;
import com.trailmap.service.AdminMapDataService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 百度行政区划与地理编码实现，给管理端提供可信的省市关系和城市中心点。
 */
@Service
public class AdminMapDataServiceImpl implements AdminMapDataService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Duration REGION_CACHE_TTL = Duration.ofHours(12);
    private static final Set<String> MUNICIPALITY_CODES = Set.of("110000", "120000", "310000", "500000");

    private final BaiduMapProperties baiduMapProperties;
    private final RestClient restClient;
    private final ConcurrentHashMap<String, CachedRegionList> regionCache = new ConcurrentHashMap<>();

    /**
     * 使用 Spring Boot 统一配置的客户端构建器创建百度地图请求客户端。
     */
    public AdminMapDataServiceImpl(
            BaiduMapProperties baiduMapProperties,
            RestClient.Builder restClientBuilder) {
        this.baiduMapProperties = baiduMapProperties;
        this.restClient = restClientBuilder.build();
    }

    @Override
    public List<AdminProvinceOptionResponse> listProvinces(String keyword) {
        List<RegionNode> provinces = loadRegions("provinces", "中国", 1).stream()
                // 百度当前会返回“苏鲁交界”等非标准实验区域，管理端只接受常规六位省级 adcode。
                .filter(region -> region.level() == 1 && isStandardProvinceCode(region.code()))
                .toList();
        String normalizedKeyword = normalizeKeyword(keyword);
        return provinces.stream()
                .filter(region -> matchesKeyword(region, normalizedKeyword))
                .map(region -> new AdminProvinceOptionResponse(region.code(), region.name()))
                .toList();
    }

    @Override
    public List<AdminCityOptionResponse> listCities(String provinceCode, String keyword) {
        AdminProvinceOptionResponse province = findProvince(provinceCode);
        String normalizedKeyword = normalizeKeyword(keyword);

        if (MUNICIPALITY_CODES.contains(province.code())) {
            AdminCityOptionResponse municipality = new AdminCityOptionResponse(
                    province.code(),
                    province.name(),
                    province.code(),
                    province.name());
            return matchesKeyword(new RegionNode(municipality.code(), municipality.name(), 2), normalizedKeyword)
                    ? List.of(municipality)
                    : List.of();
        }

        return loadRegions("cities:" + province.code(), province.code(), 1).stream()
                .filter(region -> region.level() == 2)
                .filter(region -> matchesKeyword(region, normalizedKeyword))
                .map(region -> new AdminCityOptionResponse(
                        region.code(),
                        region.name(),
                        province.code(),
                        province.name()))
                .toList();
    }

    @Override
    public List<AdminCityOptionResponse> searchCities(String keyword) {
        String normalizedKeyword = normalizeKeyword(keyword);
        if (!StringUtils.hasText(normalizedKeyword)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "请输入城市或省份名称");
        }

        Map<String, AdminCityOptionResponse> suggestions = new LinkedHashMap<>();
        for (RegionTreeNode match : requestRegionMatches(normalizedKeyword, 1)) {
            if (match.level() == 1 && isStandardProvinceCode(match.code())) {
                AdminProvinceOptionResponse province =
                        new AdminProvinceOptionResponse(match.code(), match.name());
                if (MUNICIPALITY_CODES.contains(province.code())) {
                    addCitySuggestion(suggestions, province, province.code(), province.name());
                    continue;
                }
                match.children().stream()
                        .filter(city -> city.level() == 2)
                        .forEach(city ->
                                addCitySuggestion(suggestions, province, city.code(), city.name()));
                continue;
            }
            if (match.level() == 2 && isStandardRegionCode(match.code())) {
                AdminProvinceOptionResponse province =
                        findProvince(resolveProvinceCode(match.code()));
                addCitySuggestion(suggestions, province, match.code(), match.name());
            }
        }
        return suggestions.values().stream().limit(50).toList();
    }

    @Override
    public AdminCityLocationResponse resolveCity(String provinceCode, String cityCode) {
        AdminCityOptionResponse city = listCities(provinceCode, null).stream()
                .filter(candidate -> candidate.code().equals(cityCode))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "城市不属于所选省份，请重新选择"));
        CoordinateResponse center = geocodeCity(city);
        return new AdminCityLocationResponse(city.name(), city.provinceName(), city.code(), center);
    }

    /**
     * 从缓存或百度接口加载行政区列表，省份取“中国”的下级，城市取指定省份的下级。
     */
    private List<RegionNode> loadRegions(String cacheKey, String keyword, int subAdmin) {
        ensureServerAk();
        CachedRegionList cached = regionCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.regions();
        }

        List<RegionNode> regions = requestRegionTree(keyword, subAdmin);
        regionCache.put(cacheKey, new CachedRegionList(regions, Instant.now().plus(REGION_CACHE_TTL)));
        return regions;
    }

    /**
     * 调用百度行政区划接口并提取查询区域的直接下级节点。
     */
    private List<RegionNode> requestRegionTree(String keyword, int subAdmin) {
        return requestRegionMatches(keyword, subAdmin).stream()
                .findFirst()
                .map(RegionTreeNode::children)
                .orElseGet(List::of);
    }

    /**
     * 调用百度行政区划接口，保留命中的区域及其直接下级，供组合搜索复用。
     */
    private List<RegionTreeNode> requestRegionMatches(String keyword, int subAdmin) {
        ensureServerAk();
        try {
            String responseText = restClient.get()
                    .uri(UriComponentsBuilder.fromHttpUrl(baiduMapProperties.getRegionSearchUrl())
                            .queryParam("keyword", keyword)
                            .queryParam("sub_admin", subAdmin)
                            .queryParam("extensions_code", 1)
                            .queryParam("ak", baiduMapProperties.getServerAk())
                            .build()
                            .encode()
                            .toUri())
                    .retrieve()
                    .body(String.class);
            JsonNode root = OBJECT_MAPPER.readTree(responseText);
            if (root.path("status").asInt(-1) != 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "百度行政区划查询失败，请稍后重试");
            }
            return StreamSupport.stream(root.path("districts").spliterator(), false)
                    .filter(JsonNode::isObject)
                    .map(this::toRegionTreeNode)
                    .toList();
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "百度行政区划服务暂时不可用");
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "百度行政区划结果解析失败");
        }
    }

    /**
     * 对已确认的行政区调用地理编码，统一返回项目使用的 GCJ-02 坐标。
     */
    private CoordinateResponse geocodeCity(AdminCityOptionResponse city) {
        ensureServerAk();
        try {
            String responseText = restClient.get()
                    .uri(UriComponentsBuilder.fromHttpUrl(baiduMapProperties.getGeocodingUrl())
                            .queryParam("address", city.provinceName() + city.name())
                            .queryParam("city", city.name())
                            .queryParam("output", "json")
                            .queryParam("ret_coordtype", "gcj02ll")
                            .queryParam("ak", baiduMapProperties.getServerAk())
                            .build()
                            .encode()
                            .toUri())
                    .retrieve()
                    .body(String.class);
            JsonNode root = OBJECT_MAPPER.readTree(responseText);
            JsonNode location = root.path("result").path("location");
            if (root.path("status").asInt(-1) != 0
                    || !location.path("lng").isNumber()
                    || !location.path("lat").isNumber()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "城市中心点解析失败，请重新选择城市");
            }
            return new CoordinateResponse(
                    normalizeCoordinate(location.path("lng").asText()),
                    normalizeCoordinate(location.path("lat").asText()));
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "百度地理编码服务暂时不可用");
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "百度地理编码结果解析失败");
        }
    }

    private RegionNode toRegionNode(JsonNode node) {
        return new RegionNode(
                node.path("code").asText(),
                node.path("name").asText(),
                node.path("level").asInt(-1));
    }

    /**
     * 百度坐标统一四舍五入到数据库约定的 6 位小数，避免显示值与提交值精度不一致。
     */
    private BigDecimal normalizeCoordinate(String value) {
        return new BigDecimal(value).setScale(6, RoundingMode.HALF_UP);
    }

    private RegionTreeNode toRegionTreeNode(JsonNode node) {
        List<RegionNode> children = StreamSupport.stream(
                        node.path("districts").spliterator(),
                        false)
                .filter(JsonNode::isObject)
                .map(this::toRegionNode)
                .toList();
        return new RegionTreeNode(
                node.path("code").asText(),
                node.path("name").asText(),
                node.path("level").asInt(-1),
                children);
    }

    /**
     * 写入去重后的城市候选；直辖市统一沿用项目现有的省级 adcode。
     */
    private void addCitySuggestion(
            Map<String, AdminCityOptionResponse> suggestions,
            AdminProvinceOptionResponse province,
            String cityCode,
            String cityName) {
        if (!isStandardRegionCode(cityCode)) {
            return;
        }
        String normalizedCityCode =
                MUNICIPALITY_CODES.contains(province.code()) ? province.code() : cityCode;
        String normalizedCityName =
                MUNICIPALITY_CODES.contains(province.code()) ? province.name() : cityName;
        suggestions.putIfAbsent(
                normalizedCityCode,
                new AdminCityOptionResponse(
                        normalizedCityCode,
                        normalizedCityName,
                        province.code(),
                        province.name()));
    }

    private AdminProvinceOptionResponse findProvince(String provinceCode) {
        if (!StringUtils.hasText(provinceCode)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "请先选择所属省份");
        }
        String normalizedProvinceCode = provinceCode.trim();
        AdminProvinceOptionResponse cachedProvince = listProvinces(null).stream()
                .filter(province -> province.code().equals(provinceCode.trim()))
                .findFirst()
                .orElse(null);
        if (cachedProvince != null) {
            return cachedProvince;
        }

        // 全量行政区列表异常缺项时，再按编码精确查询，避免合法省份被误判为不存在。
        return requestRegionMatches(normalizedProvinceCode, 0).stream()
                .filter(region -> region.level() == 1)
                .filter(region -> normalizedProvinceCode.equals(region.code()))
                .map(region -> new AdminProvinceOptionResponse(region.code(), region.name()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.BAD_REQUEST,
                        "所属省份不存在，请重新选择"));
    }

    private boolean matchesKeyword(RegionNode region, String keyword) {
        return !StringUtils.hasText(keyword)
                || region.name().contains(keyword)
                || region.code().contains(keyword);
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    /**
     * 省级行政区划编码固定为六位，首位 1～8；排除百度返回的 99 开头实验区域。
     */
    static boolean isStandardProvinceCode(String code) {
        return code != null && code.matches("[1-8]\\d{5}");
    }

    private static boolean isStandardRegionCode(String code) {
        return code != null && code.matches("[1-8]\\d{5}");
    }

    private static String resolveProvinceCode(String cityCode) {
        return cityCode.substring(0, 2) + "0000";
    }

    private void ensureServerAk() {
        if (!StringUtils.hasText(baiduMapProperties.getServerAk())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "未配置百度地图服务端 AK，无法查询行政区划");
        }
    }

    private record RegionNode(String code, String name, int level) {
    }

    private record RegionTreeNode(
            String code,
            String name,
            int level,
            List<RegionNode> children) {
    }

    private record CachedRegionList(List<RegionNode> regions, Instant expiresAt) {

        private boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
