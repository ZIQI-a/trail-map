import { EnvironmentOutlined } from "@ant-design/icons";
import { Scene, Map as L7Map, PointLayer, PolygonLayer, Popup } from "@antv/l7";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CheckinSpotItemDto,
  GeoPoint,
  SpotType,
} from "../../../types/mapWorkbench";
import styles from "./CheckinL7FootprintMap.module.css";

type FootprintMapMode = "country" | "city";

interface CheckinL7FootprintMapProps {
  mode: FootprintMapMode;
  onSpotSelect: (spotId: number) => void;
  selectedCityName?: string;
  selectedSpotId?: number;
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

const FOOTPRINT_MAP_STYLE = "dark";
const CHINA_PROVINCES_GEOJSON_URL = "/geo/china-provinces.json";

// 锁定状态的图标 SVG (参考 Ant Design LockOutlined 风格)
const LOCK_ICON_SVG = `data:image/svg+xml;base64,${btoa(`
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <path d="M832 448H192c-17.7 0-32 14.3-32 32v448c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V480c0-17.7-14.3-32-32-32zM512 704c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z" fill="#8090a7"/>
  <path d="M512 128c-106 0-192 86-192 192v128h384V320c0-106-86-192-192-192z" stroke="#8090a7" stroke-width="64" fill="none"/>
</svg>
`)}`;

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
  mode,
  onSpotSelect,
  selectedCityName,
  selectedSpotId,
  spots,
}: CheckinL7FootprintMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [chinaGeoJson, setChinaGeoJson] =
    useState<ProvinceFeatureCollection>();
  const provinceStats = useMemo(() => buildProvinceStats(spots), [spots]);

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

  // L7 场景依赖真实 DOM 容器；模式、筛选或选中变化时重建图层，保持地图与列表同步。
  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    sceneRef.current?.destroy();
    const scene = new Scene({
      id: containerRef.current,
      map: new L7Map(resolveMapOptions(mode, spots)),
      logoVisible: false,
    });
    sceneRef.current = scene;

    scene.on("loaded", () => {
      // 注册极简锁定图标
      scene.addImage("lock-icon", LOCK_ICON_SVG);

      if (mode === "country") {
        if (chinaGeoJson) {
          addCountryLayers(scene, provinceStats, chinaGeoJson);
        }
        return;
      }
      addCityPointLayer(scene, spots, selectedSpotId, onSpotSelect);
    });

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [chinaGeoJson, mode, onSpotSelect, provinceStats, selectedSpotId, spots]);

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
        <strong>{mode === "country" ? "全国足迹总览" : selectedCityName}</strong>
        <span>
          {mode === "country"
            ? `已解锁 ${unlockedProvinceCount} 个省市 · ${spots.length} 个景点`
            : `${spots.length} 个已打卡景点`}
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
              已打卡景点
            </span>
            <span>
              <i className={styles.legendSelected} />
              当前选中
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function resolveMapOptions(mode: FootprintMapMode, spots: CheckinSpotItemDto[]) {
  if (mode === "country") {
    return {
      center: [104.6, 35.8] as [number, number],
      zoom: 3.05,
      pitch: 0,
      style: FOOTPRINT_MAP_STYLE,
    };
  }

  const center = resolveMapCenter(spots);
  return {
    center: [center.lng, center.lat] as [number, number],
    zoom: spots.length > 1 ? 10 : 12,
    pitch: 0,
    // 深色底图能压低道路和地名干扰，让打卡点、后续轨迹线更突出。
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
      stroke: "#29486f",
      strokeWidth: 0.8,
    });

  const labelData = buildProvinceLabelData(provinceStats, provinceGeoJson);

  // 省份名称图层
  const nameLayer = new PointLayer({ name: "province-names" })
    .source(labelData, {
      parser: { type: "json", x: "lng", y: "lat" },
    })
    .shape("name", "text")
    .size(11)
    .color("labelColor")
    .style({
      opacity: 0.9,
      textAnchor: "center",
      textOffset: [0, -10],
      stroke: "#081628",
      strokeWidth: 2,
    });

  // 状态图标层（锁或状态点）
  const statusIconLayer = new PointLayer({ name: "province-status-icons" })
    .source(labelData, {
      parser: { type: "json", x: "lng", y: "lat" },
    })
    .shape("shape")
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

  scene.addLayer(polygonLayer);
  scene.addLayer(statusIconLayer);
  scene.addLayer(nameLayer);
}

function addCityPointLayer(
  scene: Scene,
  spots: CheckinSpotItemDto[],
  selectedSpotId: number | undefined,
  onSpotSelect: (spotId: number) => void,
) {
  if (spots.length === 0) {
    return;
  }

  const layerData = spots.map((spot) => ({
    ...spot,
    lng: spot.position.lng,
    lat: spot.position.lat,
    selected: spot.spotId === selectedSpotId ? 1 : 0,
    color: resolveSpotColor(spot.type),
    pointSize: resolvePointSize(spot, spot.spotId === selectedSpotId),
  }));
  const pointLayer = new PointLayer({ name: "checkin-points" })
    .source(layerData, {
      parser: {
        type: "json",
        x: "lng",
        y: "lat",
      },
    })
    .shape("circle")
    .size("pointSize")
    .color("color")
    .style({
      opacity: 0.92,
      strokeWidth: 3,
      stroke: "#ffffff",
      offsets: [0, 0],
    });

  // L7 图层事件类型较宽，这里只取 feature 原始数据用于联动右侧列表。
  (
    pointLayer as unknown as {
      on: (
        event: string,
        handler: (event: { feature?: CheckinSpotItemDto }) => void,
      ) => void;
    }
  ).on("click", (event) => {
    if (event.feature?.spotId) {
      onSpotSelect(event.feature.spotId);
    }
  });
  scene.addLayer(pointLayer);
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
      count,
      shape: count > 0 ? "circle" : "lock-icon",
      iconSize: count > 0 ? 12 : 14,
      statusColor: count > 0 ? resolveProvinceColor(count) : "#455a7a",
      labelColor: count > 0 ? "#eaf4ff" : "#8090a7",
      lat: labelPoint?.[1] ?? 35.8,
      lng: labelPoint?.[0] ?? 104.6,
    };
  });
}

function resolveProvinceName(cityName: string) {
  return normalizeProvinceName(CITY_PROVINCE_MAP[cityName] ?? cityName);
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

// 根据打卡类型，返回对应的图例颜色。
function resolveSpotColor(type: SpotType) {
  switch (type) {
    case "food":
    case "night":
      return "#ff8a1f";
    case "museum":
    case "history":
      return "#2266e8";
    case "family":
      return "#10b981";
    default:
      return "#14b8a6";
  }
}

function resolvePointSize(spot: CheckinSpotItemDto, selected: boolean) {
  if (selected) {
    return 24;
  }
  return Math.max(14, Math.min(22, 12 + spot.recommendScore * 1.2));
}
