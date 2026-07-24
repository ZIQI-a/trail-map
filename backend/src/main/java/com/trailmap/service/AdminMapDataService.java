package com.trailmap.service;

import com.trailmap.model.response.AdminCityLocationResponse;
import com.trailmap.model.response.AdminCityOptionResponse;
import com.trailmap.model.response.AdminProvinceOptionResponse;
import java.util.List;

/**
 * 管理端地图资料服务，集中处理行政区划查询和城市中心点解析。
 */
public interface AdminMapDataService {

    /** 查询省份 */
    List<AdminProvinceOptionResponse> listProvinces(String keyword);

    /** 查询省份对应的城市 */
    List<AdminCityOptionResponse> listCities(String provinceCode, String keyword);

    /** 解析城市中心点 */
    AdminCityLocationResponse resolveCity(String provinceCode, String cityCode);
}
