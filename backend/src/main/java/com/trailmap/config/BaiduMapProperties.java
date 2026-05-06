package com.trailmap.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 百度地图服务端配置，集中管理校准检索和后续服务端能力需要的 AK 与基础地址。
 */
@ConfigurationProperties(prefix = "baidu.map")
public class BaiduMapProperties {

    private String serverAk;
    private String placeSearchUrl = "https://api.map.baidu.com/place/v2/search";

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
}
