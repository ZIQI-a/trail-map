import { EnvironmentOutlined } from "@ant-design/icons";
import { Scene, Map as L7Map, PointLayer, PolygonLayer, Popup } from "@antv/l7";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type {
  TravelCityDto,
} from "../../../types/mapWorkbench";
import {
  CHINA_PROVINCES_GEOJSON_URL,
  COUNTRY_MAP_OPTIONS,
  FOOTPRINT_MAP_STYLE,
  PROVINCE_CITY_GEOJSON_BASE_URL,
  PROVINCE_VIEW_CONFIG,
} from "./constants";
import {
  buildCityFeatureCollection,
  buildCityLabelData,
  buildCityStats,
  filterFootprintCitiesByProvince,
  buildProvinceFeatureCollection,
  buildProvinceLabelData,
  buildProvinceStats,
} from "./geoData";
import {
  normalizeCityName,
  normalizeProvinceName,
  resolveMapCenter,
  resolveProvinceAdcodeFromCityCode,
} from "./geoUtils";
import styles from "./CheckinL7FootprintMap.module.css";
import type {
  CityStatistic,
  FootprintStatisticBundle,
  FootprintMapMode,
  ProvinceFeatureCollection,
  ProvinceStatistic,
} from "./types";

interface CheckinL7FootprintMapProps {
  availableCities: TravelCityDto[];
  footprint: FootprintStatisticBundle;
  interactive?: boolean;
  mode: FootprintMapMode;
  onOpenCity?: (cityId: number) => void;
  selectedCity?: TravelCityDto;
  selectedCityName?: string;
  showHeader?: boolean;
  showLegend?: boolean;
}

interface L7FeatureEvent {
  feature?: { properties?: Record<string, unknown> } & Record<string, unknown>;
  lngLat?: { lng: number; lat: number };
}

/**
 * CheckinL7FootprintMap 专注承载 AntV L7 地理可视化，页面层只负责传入聚合统计和选中状态。
 */
export function CheckinL7FootprintMap({
  availableCities,
  footprint,
  interactive = true,
  mode,
  onOpenCity,
  selectedCity,
  selectedCityName,
  showHeader = true,
  showLegend = true,
}: CheckinL7FootprintMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [chinaGeoJson, setChinaGeoJson] = useState<ProvinceFeatureCollection>();
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
    () => filterFootprintCitiesByProvince(footprint, selectedProvinceName),
    [footprint, selectedProvinceName],
  );
  const provinceStats = useMemo(() => buildProvinceStats(footprint), [footprint]);
  const cityStats = useMemo(
    () =>
      buildCityStats({
        ...footprint,
        cities: provinceSpots,
      }),
    [footprint, provinceSpots],
  );
  const activeProvinceCityGeoJson =
    provinceCityGeoJson && provinceCityGeoJson.adcode === selectedProvinceAdcode
      ? provinceCityGeoJson.data
      : undefined;
  const initialMapOptionsRef = useRef(
    resolveMapOptions({
      mode,
      provinceSpots,
      selectedCity,
      selectedProvinceAdcode,
    }),
  );

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
    fetch(
      `${PROVINCE_CITY_GEOJSON_BASE_URL}/${selectedProvinceAdcode}_full.json`,
    )
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

  // 只初始化一次 Scene，避免筛选变化时重复创建 WebGL context。
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) {
      return undefined;
    }

    const scene = new Scene({
      id: containerRef.current,
      map: new L7Map(initialMapOptionsRef.current),
      logoVisible: false,
    });
    sceneRef.current = scene;

    // 监听上下文状态，便于在 context lost 后阻止继续对失效场景写入图层。
    const mapCanvas = scene.getMapCanvasContainer();
    const handleContextLost = () => {
      setSceneReady(false);
    };
    const handleContextRestored = () => {
      setSceneReady(true);
    };

    mapCanvas?.addEventListener("webglcontextlost", handleContextLost);
    mapCanvas?.addEventListener("webglcontextrestored", handleContextRestored);

    scene.on("loaded", () => {
      setSceneReady(true);
    });

    return () => {
      mapCanvas?.removeEventListener("webglcontextlost", handleContextLost);
      mapCanvas?.removeEventListener("webglcontextrestored", handleContextRestored);
      popupRef.current?.remove();
      popupRef.current = null;
      scene.destroy();
      sceneRef.current = null;
      setSceneReady(false);
    };
  }, []);

  // 视图参数变化时只更新相机，不重建 Scene。
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) {
      return;
    }

    const nextOptions = resolveMapOptions({
      mode,
      provinceSpots,
      selectedCity,
      selectedProvinceAdcode,
    });
    sceneRef.current.setMapStyle(FOOTPRINT_MAP_STYLE);
    sceneRef.current.setZoomAndCenter(nextOptions.zoom, nextOptions.center);
  }, [mode, provinceSpots, sceneReady, selectedCity, selectedProvinceAdcode]);

  // 数据变化只重绘图层和事件绑定，避免高频销毁底图。
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) {
      return;
    }

    const scene = sceneRef.current;
    popupRef.current?.remove();
    popupRef.current = null;

    void scene.removeAllLayer().then(() => {
      if (sceneRef.current !== scene) {
        return;
      }

      if (mode === "country") {
        if (chinaGeoJson) {
          addCountryLayers(
            scene,
            popupRef,
            provinceStats,
            chinaGeoJson,
            interactive,
          );
        }
        return;
      }

      if (activeProvinceCityGeoJson && selectedProvinceName) {
        addProvinceLayers({
          availableCities,
          cityStats,
          geoJson: activeProvinceCityGeoJson,
          interactive,
          onOpenCity,
          popupRef,
          scene,
          selectedProvinceName,
        });
      }
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, [
    availableCities,
    activeProvinceCityGeoJson,
    chinaGeoJson,
    cityStats,
    interactive,
    mode,
    onOpenCity,
    provinceStats,
    sceneReady,
    selectedProvinceName,
  ]);

  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapCanvas} ref={containerRef} />
      {footprint.totalCheckinCount === 0 ? (
        <div className={styles.mapEmpty}>
          <EnvironmentOutlined />
          <span>暂无可展示的打卡点</span>
        </div>
      ) : null}
      {showHeader ? (
        <div className={styles.mapHeader}>
          <strong>
            {mode === "country"
              ? "全国足迹总览"
              : `${selectedProvinceName ?? selectedCityName}足迹`}
          </strong>
          <span>
            {mode === "country"
              ? `已解锁 ${footprint.unlockedProvinceCount} 个省市 · ${footprint.totalCheckinCount} 个景点`
              : `覆盖 ${cityStats.size} 个城市 · ${provinceSpots.reduce((total, item) => total + item.checkinCount, 0)} 个足迹`}
          </span>
        </div>
      ) : null}
      {showLegend ? (
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
      ) : null}
    </section>
  );
}

/**
 * 根据当前地图层级生成 L7 内置底图参数，避免组件主体混入视口计算细节。
 */
function resolveMapOptions({
  mode,
  provinceSpots,
  selectedCity,
  selectedProvinceAdcode,
}: {
  mode: FootprintMapMode;
  provinceSpots: FootprintStatisticBundle["cities"];
  selectedCity?: TravelCityDto;
  selectedProvinceAdcode?: string;
}) {
  if (mode === "country") {
    return {
      ...COUNTRY_MAP_OPTIONS,
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

/**
 * 添加全国视图图层：省份轮廓、分级填色、名称标签和悬浮提示。
 */
function addCountryLayers(
  scene: Scene,
  popupRef: MutableRefObject<Popup | null>,
  provinceStats: Map<string, ProvinceStatistic>,
  chinaGeoJson: ProvinceFeatureCollection,
  interactive: boolean,
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
  popupRef.current = popup;

  let lastFeatureName = "";

  if (!interactive) {
    scene.addLayer(provinceOutlineLayer);
    scene.addLayer(polygonLayer);
    scene.addLayer(statusIconLayer);
    scene.addLayer(nameLayer);
    return;
  }

  const handleMouseMove = (e: L7FeatureEvent) => {
    const properties = readL7FeatureProperties(e);
    const name = String(properties.name ?? "");
    const count = Number(properties.count ?? 0);
    const cityCount = Number(properties.cityCount ?? 0);

    if (!name || !e.lngLat) {
      return;
    }

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
  };

  const handleMouseOut = () => {
    lastFeatureName = "";
    popup.remove();
  };

  // 标签层会悬浮在面上方，统一绑定 hover 才不会出现“压在文字上就不弹”的问题。
  polygonLayer.on("mousemove", handleMouseMove);
  nameLayer.on("mousemove", handleMouseMove);

  polygonLayer.on("mouseout", handleMouseOut);
  nameLayer.on("mouseout", handleMouseOut);

  scene.addLayer(provinceOutlineLayer);
  scene.addLayer(polygonLayer);
  scene.addLayer(nameLayer);
}

/**
 * 添加省份视图图层：城市轮廓、城市分级填色、聚合点和点击跳转。
 */
function addProvinceLayers({
  availableCities,
  cityStats,
  geoJson,
  interactive,
  onOpenCity,
  popupRef,
  scene,
  selectedProvinceName,
}: {
  availableCities: TravelCityDto[];
  cityStats: Map<string, CityStatistic>;
  geoJson: ProvinceFeatureCollection;
  interactive: boolean;
  onOpenCity?: (cityId: number) => void;
  popupRef: MutableRefObject<Popup | null>;
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
  popupRef.current = popup;
  let lastFeatureName = "";

  if (!interactive) {
    scene.addLayer(cityOutlineLayer);
    scene.addLayer(cityFillLayer);
    scene.addLayer(cityPointLayer);
    scene.addLayer(cityLabelLayer);
    return;
  }

  const handleMouseMove = (event: L7FeatureEvent) => {
    const properties = readL7FeatureProperties(event);
    const name = String(properties.name ?? "");
    const count = Number(properties.count ?? 0);

    if (!name || !event.lngLat) {
      return;
    }

    if (name !== lastFeatureName) {
      lastFeatureName = name;
      const supportedCity = cityByName.get(normalizeCityName(name));
      const summaryText =
        count > 0
          ? `${selectedProvinceName} · ${count} 条足迹`
          : `${selectedProvinceName} · 暂未打卡`;
      const actionText = supportedCity
        ? "点击进入主页查看城市景点"
        : "暂无主页城市数据";
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
  };

  const handleMouseOut = () => {
    lastFeatureName = "";
    popup.remove();
  };

  const handleClick = (event: L7FeatureEvent) => {
    const properties = readL7FeatureProperties(event);
    const name = String(properties.name ?? "");
    const city = cityByName.get(normalizeCityName(name));
    if (city) {
      onOpenCity?.(city.id);
    }
  };

  // 鼠标压在城市文字上时也保持 hover/click 可用。
  cityFillLayer.on("mousemove", handleMouseMove);
  cityLabelLayer.on("mousemove", handleMouseMove);

  cityFillLayer.on("mouseout", handleMouseOut);
  cityLabelLayer.on("mouseout", handleMouseOut);

  cityFillLayer.on("click", handleClick);
  cityLabelLayer.on("click", handleClick);

  scene.addLayer(cityOutlineLayer);
  scene.addLayer(cityFillLayer);
  scene.addLayer(cityLabelLayer);
}

/**
 * 兼容 L7 不同图层事件返回结构：面图层通常在 properties，点/文字层可能直接返回原始数据。
 */
function readL7FeatureProperties(event: L7FeatureEvent) {
  return event.feature?.properties ?? event.feature ?? {};
}
