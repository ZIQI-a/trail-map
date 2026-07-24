package com.trailmap.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 百度地图服务端配置，集中管理校准检索和后续服务端能力需要的 AK 与基础地址。
 */
@ConfigurationProperties(prefix = "baidu.map")
public class BaiduMapProperties {

    private String serverAk;
    private String placeSearchUrl = "https://api.map.baidu.com/place/v2/search";
    private String regionSearchUrl = "https://api.map.baidu.com/api_region_search/v1/";
    private String geocodingUrl = "https://api.map.baidu.com/geocoding/v3/";
    private String routeDrivingUrl = "https://api.map.baidu.com/directionlite/v1/driving";
    private String routeWalkingUrl = "https://api.map.baidu.com/directionlite/v1/walking";
    private String routeRidingUrl = "https://api.map.baidu.com/directionlite/v1/riding";
    private String routeTransitUrl = "https://api.map.baidu.com/directionlite/v1/transit";

    public String getServerAk() {
        return serverAk;
    }

    public void setServerAk(String serverAk) {
        this.serverAk = serverAk;
    }

    public String getPlaceSearchUrl() {
        return placeSearchUrl;
    }

    public void setPlaceSearchUrl(String placeSearchUrl) {
        this.placeSearchUrl = placeSearchUrl;
    }

    public String getRegionSearchUrl() {
        return regionSearchUrl;
    }

    public void setRegionSearchUrl(String regionSearchUrl) {
        this.regionSearchUrl = regionSearchUrl;
    }

    public String getGeocodingUrl() {
        return geocodingUrl;
    }

    public void setGeocodingUrl(String geocodingUrl) {
        this.geocodingUrl = geocodingUrl;
    }

    public String getRouteDrivingUrl() {
        return routeDrivingUrl;
    }

    public void setRouteDrivingUrl(String routeDrivingUrl) {
        this.routeDrivingUrl = routeDrivingUrl;
    }

    public String getRouteWalkingUrl() {
        return routeWalkingUrl;
    }

    public void setRouteWalkingUrl(String routeWalkingUrl) {
        this.routeWalkingUrl = routeWalkingUrl;
    }

    public String getRouteRidingUrl() {
        return routeRidingUrl;
    }

    public void setRouteRidingUrl(String routeRidingUrl) {
        this.routeRidingUrl = routeRidingUrl;
    }

    public String getRouteTransitUrl() {
        return routeTransitUrl;
    }

    public void setRouteTransitUrl(String routeTransitUrl) {
        this.routeTransitUrl = routeTransitUrl;
    }
}
