import { EnvironmentOutlined } from "@ant-design/icons";
import { Scene, Map as L7Map, PointLayer, PolygonLayer, Popup } from "@antv/l7";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CheckinSpotItemDto,
  GeoPoint,
  TravelCityDto,
} from "../../../types/mapWorkbench";
import styles from "./CheckinL7FootprintMap.module.css";

type FootprintMapMode = "country" | "province";

interface CheckinL7FootprintMapProps {
  availableCities: TravelCityDto[];
  mode: FootprintMapMode;
  onOpenCity?: (cityId: number) => void;
  selectedCity?: TravelCityDto;
  selectedCityName?: string;
  spots: CheckinSpotItemDto[];
}

interface ProvinceFeatureProperties {
  adcode?: number;
  center?: [number, number];
  centroid?: [number, number];
  cityCount: number;
  color: string;
  count: number;
  name: string;
  statusText: string;
  [key: string]: unknown;
}

interface ProvinceFeature {
  geometry: {
    coordinates: unknown;
    type: "Polygon" | "MultiPolygon";
  };
  properties: ProvinceFeatureProperties;
  type: "Feature";
}

interface ProvinceFeatureCollection {
  features: ProvinceFeature[];
  type: "FeatureCollection";
}

interface ProvinceStatistic {
  cityNames: Set<string>;
  count: number;
}

interface CityStatistic {
  count: number;
  firstSpotId?: number;
  position: GeoPoint;
}

const FOOTPRINT_MAP_STYLE = "dark";
const CHINA_PROVINCES_GEOJSON_URL = "/geo/china-provinces.json";
const PROVINCE_CITY_GEOJSON_BASE_URL = "/geo/provinces";

const PROVINCE_VIEW_CONFIG: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  "510000": { center: [102.7, 30.6], zoom: 5.7 },
  "610000": { center: [108.9, 35.2], zoom: 6.35 },
};

const CITY_PROVINCE_MAP: Record<string, string> = {
  北京: "北京",
  北京市: "北京",
  上海: "上海",
  上海市: "上海",
  天津: "天津",
  天津市: "天津",
  重庆: "重庆",
  重庆市: "重庆",
  成都: "四川",
  成都市: "四川",
  西安: "陕西",
  西安市: "陕西",
  杭州: "浙江",
  杭州市: "浙江",
  广州: "广东",
  广州市: "广东",
  深圳: "广东",
  深圳市: "广东",
  南京: "江苏",
  南京市: "江苏",
  苏州: "江苏",
  苏州市: "江苏",
  武汉: "湖北",
  武汉市: "湖北",
  长沙: "湖南",
  长沙市: "湖南",
  厦门: "福建",
  厦门市: "福建",
  青岛: "山东",
  青岛市: "山东",
  济南: "山东",
  济南市: "山东",
  昆明: "云南",
  昆明市: "云南",
  桂林: "广西",
  桂林市: "广西",
  拉萨: "西藏",
  拉萨市: "西藏",
  乌鲁木齐: "新疆",
  乌鲁木齐市: "新疆",
};

// CheckinL7FootprintMap 专注承载 AntV L7 地理可视化，页面层只负责传入打卡数据和选中状态。
export function CheckinL7FootprintMap({
  availableCities,
  mode,
  onOpenCity,
  selectedCity,
  selectedCityName,
  spots,
}: CheckinL7FootprintMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [chinaGeoJson, setChinaGeoJson] =
    useState<ProvinceFeatureCollection>();
  const [provinceCityGeoJson, setProvinceCityGeoJson] = useState<{
    adcode: string;
    data: ProvinceFeatureCollection;
  }>();
  const selectedProvinceName = selectedCity
    ? normalizeProvinceName(selectedCity.provinceName)
    : undefined;
  const selectedProvinceAdcode = selectedCity
    ? resolveProvinceAdcodeFromCityCode(selectedCity.cityCode)
    : undefined;
  const provinceSpots = useMemo(
    () =>
      selectedProvinceName
        ? spots.filter(
            (spot) => resolveProvinceName(spot.cityName) === selectedProvinceName,
          )
        : spots,
    [selectedProvinceName, spots],
  );
  const provinceStats = useMemo(() => buildProvinceStats(spots), [spots]);
  const cityStats = useMemo(() => buildCityStats(provinceSpots), [provinceSpots]);
  const activeProvinceCityGeoJson =
    provinceCityGeoJson && provinceCityGeoJson.adcode === selectedProvinceAdcode
      ? provinceCityGeoJson.data
      : undefined;

  // 全国地图边界作为本地静态资源加载，避免运行时依赖第三方接口和跨域。
  useEffect(() => {
    let ignore = false;
    fetch(CHINA_PROVINCES_GEOJSON_URL)
      .then((response) => response.json() as Promise<ProvinceFeatureCollection>)
      .then((data) => {
        if (!ignore) {
          setChinaGeoJson(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setChinaGeoJson(undefined);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 省份视图读取本地缓存的市级边界，失败时保留空状态，避免运行时依赖地图 API。
  useEffect(() => {
    if (!selectedProvinceAdcode) {
      return;
    }

    let ignore = false;
    fetch(`${PROVINCE_CITY_GEOJSON_BASE_URL}/${selectedProvinceAdcode}_full.json`)
      .then((response) => response.json() as Promise<ProvinceFeatureCollection>)
      .then((data) => {
        if (!ignore) {
          setProvinceCityGeoJson({
            adcode: selectedProvinceAdcode,
            data,
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setProvinceCityGeoJson((current) =>
            current?.adcode === selectedProvinceAdcode ? undefined : current,
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedProvinceAdcode]);

  // L7 场景依赖真实 DOM 容器；模式、筛选或选中变化时重建图层，保持地图与列表同步。
  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    sceneRef.current?.destroy();
    const scene = new Scene({
      id: containerRef.current,
      map: new L7Map(
        resolveMapOptions({
          mode,
          provinceSpots,
          selectedCity,
          selectedProvinceAdcode,
        }),
      ),
      logoVisible: false,
    });
    sceneRef.current = scene;

    scene.on("loaded", () => {
      if (mode === "country") {
        if (chinaGeoJson) {
          addCountryLayers(scene, provinceStats, chinaGeoJson);
        }
        return;
      }
      if (activeProvinceCityGeoJson && selectedProvinceName) {
        addProvinceLayers({
          availableCities,
          cityStats,
          geoJson: activeProvinceCityGeoJson,
          onOpenCity,
          scene,
          selectedProvinceName,
        });
      }
    });

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [
    availableCities,
    activeProvinceCityGeoJson,
    chinaGeoJson,
    cityStats,
    mode,
    onOpenCity,
    provinceSpots,
    provinceStats,
    selectedCity,
    selectedProvinceAdcode,
    selectedProvinceName,
    spots,
  ]);

  const unlockedProvinceCount = Array.from(provinceStats.values()).filter(
    (item) => item.count > 0,
  ).length;

  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapCanvas} ref={containerRef} />
      {spots.length === 0 ? (
        <div className={styles.mapEmpty}>
          <EnvironmentOutlined />
          <span>暂无可展示的打卡点</span>
        </div>
      ) : null}
      <div className={styles.mapHeader}>
        <strong>
          {mode === "country"
            ? "全国足迹总览"
            : `${selectedProvinceName ?? selectedCityName}足迹`}
        </strong>
        <span>
          {mode === "country"
            ? `已解锁 ${unlockedProvinceCount} 个省市 · ${spots.length} 个景点`
            : `覆盖 ${cityStats.size} 个城市 · ${provinceSpots.length} 个足迹`}
        </span>
      </div>
      <div className={styles.mapLegend}>
        {mode === "country" ? (
          <>
            <span>
              <i className={styles.legendLocked} />
              未解锁
            </span>
            <span>
              <i className={styles.legendLow} />
              1-3
            </span>
            <span>
              <i className={styles.legendMid} />
              4-9
            </span>
            <span>
              <i className={styles.legendHigh} />
              10+
            </span>
          </>
        ) : (
          <>
            <span>
              <i className={styles.legendChecked} />
              已打卡城市
            </span>
            <span>
              <i className={styles.legendSelected} />
              可查看主页
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function resolveMapOptions({
  mode,
  provinceSpots,
  selectedCity,
  selectedProvinceAdcode,
}: {
  mode: FootprintMapMode;
  provinceSpots: CheckinSpotItemDto[];
  selectedCity?: TravelCityDto;
  selectedProvinceAdcode?: string;
}) {
  if (mode === "country") {
    return {
      center: [104.6, 35.8] as [number, number],
      zoom: 3.05,
      pitch: 0,
      style: FOOTPRINT_MAP_STYLE,
    };
  }

  const provinceConfig = selectedProvinceAdcode
    ? PROVINCE_VIEW_CONFIG[selectedProvinceAdcode]
    : undefined;
  const fallbackCenter = resolveMapCenter(provinceSpots);
  const center =
    provinceConfig?.center ??
    (selectedCity
      ? ([selectedCity.center.lng, selectedCity.center.lat] as [number, number])
      : undefined) ??
    ([fallbackCenter.lng, fallbackCenter.lat] as [number, number]);
  return {
    center,
    zoom: provinceConfig?.zoom ?? 6,
    pitch: 0,
    // 省份视图仍使用 L7 内置底图，只叠加市级边界和城市统计，不展示具体景点地点。
    style: FOOTPRINT_MAP_STYLE,
  };
}

function addCountryLayers(
  scene: Scene,
  provinceStats: Map<string, ProvinceStatistic>,
  chinaGeoJson: ProvinceFeatureCollection,
) {
  const provinceGeoJson = buildProvinceFeatureCollection(
    provinceStats,
    chinaGeoJson,
  );

  // 底层轮廓先绘制一遍深色边界，给省界增加阴影感和层次。
  const provinceOutlineLayer = new PolygonLayer({
    name: "checkin-province-outline",
    zIndex: 0,
  })
    .source(provinceGeoJson)
    .shape("line")
    .color("#071528")
    .size(2.4)
    .style({
      opacity: 0.72,
      lineType: "solid",
    });

  const polygonLayer = new PolygonLayer({ name: "checkin-province-tiles" })
    .source(provinceGeoJson)
    .shape("fill")
    .color("color")
    .active({
      color: "#2e6cff",
      mix: 0.2,
    })
    .style({
      opacity: 0.9,
      stroke: "#79a8e8",
      strokeOpacity: 0.72,
      strokeWidth: 1.15,
    });

  const labelData = buildProvinceLabelData(provinceStats, provinceGeoJson);

  // 省份名称图层
  const nameLayer = new PointLayer({ name: "province-names" })
    .source(labelData, {
      parser: { type: "json", x: "lng", y: "lat" },
    })
    .shape("labelText", "text")
    .size(11)
    .color("labelColor")
    .style({
      opacity: 0.9,
      textAnchor: "center",
      textOffset: [0, -10],
      stroke: "#081628",
      strokeWidth: 2,
    });

  // 状态图标层只展示已解锁省份，未解锁锁标识合并进文字标签，避免相邻省份出现重复锁图标。
  const statusIconLayer = new PointLayer({ name: "province-status-icons" })
    .source(
      labelData.filter((item) => item.count > 0),
      {
        parser: { type: "json", x: "lng", y: "lat" },
      },
    )
    .shape("circle")
    .size("iconSize")
    .color("statusColor")
    .style({
      opacity: 0.8,
      offsets: [0, 8],
    });

  // 鼠标悬停提示 (优化为透明质感，降低视觉压迫)
  const popup = new Popup({
    offsets: [0, 0],
    closeButton: false,
    className: "l7-popup-custom",
  });

  let lastFeatureName = "";

  polygonLayer.on("mousemove", (e) => {
    const { name, count, cityCount } = e.feature.properties;

    // 仅当切换省份时才更新 HTML，减少 DOM 操作压力
    if (name !== lastFeatureName) {
      lastFeatureName = name;
      const unlockedDot =
        count > 0
          ? `<span style="background: #10b981; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 6px #10b981;"></span>`
          : "";
      const summaryText =
        count > 0
          ? `已解锁 ${cityCount} 城 · ${count} 景点`
          : "探索尚未到达此处";
      popup.setHTML(`
        <div style="padding: 8px 12px; color: #fff; background: rgba(15, 32, 55, 0.45); border-radius: 10px; border: 1px solid rgba(139, 170, 213, 0.2); backdrop-filter: blur(12px); pointer-events: none; min-width: 120px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
            ${name}
            ${unlockedDot}
          </div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); font-weight: 500;">
            ${summaryText}
          </div>
        </div>
      `);
    }

    popup.setLnglat(e.lngLat);
    if (!popup.isOpen()) {
      scene.addPopup(popup);
    }
  });

  polygonLayer.on("mouseout", () => {
    lastFeatureName = "";
    popup.remove();
  });

  scene.addLayer(provinceOutlineLayer);
  scene.addLayer(polygonLayer);
  scene.addLayer(statusIconLayer);
  scene.addLayer(nameLayer);
}

function addProvinceLayers({
  availableCities,
  cityStats,
  geoJson,
  onOpenCity,
  scene,
  selectedProvinceName,
}: {
  availableCities: TravelCityDto[];
  cityStats: Map<string, CityStatistic>;
  geoJson: ProvinceFeatureCollection;
  onOpenCity?: (cityId: number) => void;
  scene: Scene;
  selectedProvinceName: string;
}) {
  const cityGeoJson = buildCityFeatureCollection(cityStats, geoJson);
  const labelData = buildCityLabelData(cityStats, cityGeoJson);
  const cityByName = new Map(
    availableCities.map((city) => [normalizeCityName(city.name), city]),
  );
  const cityFillLayer = new PolygonLayer({ name: "checkin-city-tiles" })
    .source(cityGeoJson)
    .shape("fill")
    .color("color")
    .active({
      color: "#2e6cff",
      mix: 0.18,
    })
    .style({
      opacity: 0.88,
      stroke: "#79a8e8",
      strokeOpacity: 0.65,
      strokeWidth: 1,
    });
  const cityOutlineLayer = new PolygonLayer({ name: "checkin-city-outline" })
    .source(cityGeoJson)
    .shape("line")
    .color("#071528")
    .size(1.8)
    .style({
      opacity: 0.64,
      lineType: "solid",
    });
  const cityLabelLayer = new PointLayer({ name: "checkin-city-labels" })
    .source(labelData, {
      parser: { type: "json", x: "lng", y: "lat" },
    })
    .shape("labelText", "text")
    .size(11)
    .color("labelColor")
    .style({
      opacity: 0.92,
      textAnchor: "center",
      stroke: "#081628",
      strokeWidth: 2,
      textAllowOverlap: false,
    });
  const cityPointLayer = new PointLayer({ name: "checkin-city-points" })
    .source(
      labelData.filter((item) => item.count > 0),
      {
        parser: { type: "json", x: "lng", y: "lat" },
      },
    )
    .shape("circle")
    .size("pointSize")
    .color("statusColor")
    .style({
      opacity: 0.92,
      stroke: "#ffffff",
      strokeWidth: 1.5,
      offsets: [0, 14],
    });

  const popup = new Popup({
    offsets: [0, 0],
    closeButton: false,
    className: "l7-popup-custom",
  });
  let lastFeatureName = "";

  cityFillLayer.on("mousemove", (event) => {
    const { name, count } = event.feature.properties;
    if (name !== lastFeatureName) {
      lastFeatureName = name;
      const supportedCity = cityByName.get(normalizeCityName(name));
      const summaryText =
        count > 0
          ? `${selectedProvinceName} · ${count} 条足迹`
          : `${selectedProvinceName} · 暂未打卡`;
      const actionText = supportedCity ? "点击进入主页查看城市景点" : "暂无主页城市数据";
      popup.setHTML(`
        <div style="padding: 8px 12px; color: #fff; background: rgba(15, 32, 55, 0.45); border-radius: 10px; border: 1px solid rgba(139, 170, 213, 0.2); backdrop-filter: blur(12px); pointer-events: none; min-width: 132px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${name}</div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.66); font-weight: 500;">${summaryText}</div>
          <div style="margin-top: 4px; font-size: 11px; color: rgba(156, 203, 255, 0.78);">${actionText}</div>
        </div>
      `);
    }
    popup.setLnglat(event.lngLat);
    if (!popup.isOpen()) {
      scene.addPopup(popup);
    }
  });

  cityFillLayer.on("mouseout", () => {
    lastFeatureName = "";
    popup.remove();
  });
  cityFillLayer.on("click", (event) => {
    const city = cityByName.get(normalizeCityName(event.feature.properties.name));
    if (city) {
      onOpenCity?.(city.id);
    }
  });

  scene.addLayer(cityOutlineLayer);
  scene.addLayer(cityFillLayer);
  scene.addLayer(cityPointLayer);
  scene.addLayer(cityLabelLayer);
}

function buildProvinceStats(spots: CheckinSpotItemDto[]) {
  return spots.reduce((stats, spot) => {
    const provinceName = resolveProvinceName(spot.cityName);
    const current = stats.get(provinceName) ?? {
      cityNames: new Set<string>(),
      count: 0,
    };
    current.count += 1;
    current.cityNames.add(spot.cityName);
    stats.set(provinceName, current);
    return stats;
  }, new Map<string, ProvinceStatistic>());
}

function buildCityStats(spots: CheckinSpotItemDto[]) {
  return spots.reduce((stats, spot) => {
    const cityName = normalizeCityName(spot.cityName);
    const current = stats.get(cityName) ?? {
      count: 0,
      firstSpotId: spot.spotId,
      position: spot.position,
    };
    current.count += 1;
    stats.set(cityName, current);
    return stats;
  }, new Map<string, CityStatistic>());
}

function buildProvinceFeatureCollection(
  provinceStats: Map<string, ProvinceStatistic>,
  chinaGeoJson: ProvinceFeatureCollection,
): ProvinceFeatureCollection {
  return {
    type: "FeatureCollection",
    features: chinaGeoJson.features.map((feature) => {
      const provinceName = normalizeProvinceName(feature.properties.name);
      const stat = provinceStats.get(provinceName);
      const count = stat?.count ?? 0;
      return {
        ...feature,
        type: "Feature",
        properties: {
          ...feature.properties,
          cityCount: stat?.cityNames.size ?? 0,
          color: resolveProvinceColor(count),
          count,
          name: provinceName,
          statusText: count > 0 ? `${count} 个足迹` : "未解锁",
        },
      };
    }),
  };
}

function buildCityFeatureCollection(
  cityStats: Map<string, CityStatistic>,
  cityGeoJson: ProvinceFeatureCollection,
): ProvinceFeatureCollection {
  return {
    type: "FeatureCollection",
    features: cityGeoJson.features.map((feature) => {
      const cityName = normalizeCityName(feature.properties.name);
      const stat = cityStats.get(cityName);
      const count = stat?.count ?? 0;
      return {
        ...feature,
        type: "Feature",
        properties: {
          ...feature.properties,
          color: resolveProvinceColor(count),
          count,
          name: cityName,
          statusText: count > 0 ? `${count} 条足迹` : "未打卡",
        },
      };
    }),
  };
}

function buildProvinceLabelData(
  provinceStats: Map<string, ProvinceStatistic>,
  provinceGeoJson: ProvinceFeatureCollection,
) {
  return provinceGeoJson.features.map((feature) => {
    const provinceName = normalizeProvinceName(feature.properties.name);
    const count = provinceStats.get(provinceName)?.count ?? 0;
    const labelPoint = feature.properties.centroid ?? feature.properties.center;
    return {
      name: provinceName,
      labelText: count > 0 ? provinceName : `🔒\n${provinceName}`,
      count,
      iconSize: 12,
      statusColor: resolveProvinceColor(count),
      labelColor: count > 0 ? "#eaf4ff" : "#8090a7",
      lat: labelPoint?.[1] ?? 35.8,
      lng: labelPoint?.[0] ?? 104.6,
    };
  });
}

function buildCityLabelData(
  cityStats: Map<string, CityStatistic>,
  cityGeoJson: ProvinceFeatureCollection,
) {
  return cityGeoJson.features.map((feature) => {
    const cityName = normalizeCityName(feature.properties.name);
    const count = cityStats.get(cityName)?.count ?? 0;
    const labelPoint = feature.properties.centroid ?? feature.properties.center;
    return {
      name: cityName,
      labelText: count > 0 ? `${cityName}\n${count}` : cityName,
      count,
      pointSize: count > 0 ? Math.min(18, 10 + count * 2) : 0,
      statusColor: resolveProvinceColor(count),
      labelColor: count > 0 ? "#eaf4ff" : "#8090a7",
      lat: labelPoint?.[1] ?? 35.8,
      lng: labelPoint?.[0] ?? 104.6,
    };
  });
}

function resolveProvinceName(cityName: string) {
  return normalizeProvinceName(CITY_PROVINCE_MAP[cityName] ?? cityName);
}

function resolveProvinceAdcodeFromCityCode(cityCode: string) {
  return `${cityCode.slice(0, 2)}0000`;
}

function normalizeProvinceName(value: string) {
  return value
    .replace(/省$/, "")
    .replace(/市$/, "")
    .replace(/自治区$/, "")
    .replace(/壮族$/, "")
    .replace(/回族$/, "")
    .replace(/维吾尔$/, "")
    .replace(/特别行政区$/, "");
}

function normalizeCityName(value: string) {
  return value.replace(/市$/, "");
}

function resolveProvinceColor(count: number) {
  if (count <= 0) {
    return "#243149";
  }
  if (count <= 3) {
    return "#2a82ff";
  }
  if (count <= 9) {
    return "#00b8a9";
  }
  return "#ff9f24";
}

function resolveMapCenter(spots: CheckinSpotItemDto[]): GeoPoint {
  if (spots.length === 0) {
    return { lng: 104.066541, lat: 30.572269 };
  }
  const totals = spots.reduce(
    (acc, spot) => ({
      lng: acc.lng + spot.position.lng,
      lat: acc.lat + spot.position.lat,
    }),
    { lng: 0, lat: 0 },
  );
  return {
    lng: totals.lng / spots.length,
    lat: totals.lat / spots.length,
  };
}
