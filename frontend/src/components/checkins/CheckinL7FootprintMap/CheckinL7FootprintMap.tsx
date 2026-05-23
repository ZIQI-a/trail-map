import { EnvironmentOutlined } from "@ant-design/icons";
import { Scene, Map as L7Map, PointLayer, PolygonLayer } from "@antv/l7";
import { useEffect, useMemo, useRef } from "react";
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

interface ProvinceTile {
  center: GeoPoint;
  code: string;
  name: string;
  polygon: GeoPoint[];
}

interface ProvinceFeatureProperties {
  cityCount: number;
  color: string;
  count: number;
  name: string;
  statusText: string;
}

interface ProvinceFeature {
  geometry: {
    coordinates: number[][][];
    type: "Polygon";
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

// 省级块状图使用简化 cartogram，后续可直接替换为标准省界 GeoJSON。
const PROVINCE_TILES: ProvinceTile[] = [
  buildProvinceTile("xinjiang", "新疆", 78, 42),
  buildProvinceTile("xizang", "西藏", 87, 31),
  buildProvinceTile("qinghai", "青海", 96, 36),
  buildProvinceTile("gansu", "甘肃", 103, 38),
  buildProvinceTile("ningxia", "宁夏", 106, 37),
  buildProvinceTile("neimenggu", "内蒙古", 111, 43),
  buildProvinceTile("heilongjiang", "黑龙江", 127, 47),
  buildProvinceTile("jilin", "吉林", 126, 43),
  buildProvinceTile("liaoning", "辽宁", 122, 41),
  buildProvinceTile("beijing", "北京", 116.4, 40.1, 1.35, 0.92),
  buildProvinceTile("tianjin", "天津", 118, 39.1, 1.35, 0.92),
  buildProvinceTile("hebei", "河北", 115, 38.4),
  buildProvinceTile("shanxi", "山西", 112, 37.4),
  buildProvinceTile("shandong", "山东", 118.2, 36.4),
  buildProvinceTile("shaanxi", "陕西", 108.8, 34.5),
  buildProvinceTile("henan", "河南", 113.7, 34.5),
  buildProvinceTile("jiangsu", "江苏", 119.2, 32.8),
  buildProvinceTile("anhui", "安徽", 117.4, 31.6),
  buildProvinceTile("shanghai", "上海", 121.3, 31.2, 1.35, 0.92),
  buildProvinceTile("hubei", "湖北", 112.4, 30.6),
  buildProvinceTile("chongqing", "重庆", 107.8, 30),
  buildProvinceTile("sichuan", "四川", 102.6, 30.7),
  buildProvinceTile("yunnan", "云南", 101.5, 24.8),
  buildProvinceTile("guizhou", "贵州", 106.5, 26.5),
  buildProvinceTile("hunan", "湖南", 112, 27.5),
  buildProvinceTile("jiangxi", "江西", 115.6, 27.5),
  buildProvinceTile("zhejiang", "浙江", 120.5, 29.2),
  buildProvinceTile("fujian", "福建", 118.5, 25.8),
  buildProvinceTile("guangxi", "广西", 108.3, 23.5),
  buildProvinceTile("guangdong", "广东", 113.5, 23.2),
  buildProvinceTile("hainan", "海南", 110.2, 19.2, 1.55, 1.05),
  buildProvinceTile("taiwan", "台湾", 121, 23.7, 1.55, 1.8),
  buildProvinceTile("xianggang", "香港", 114.1, 22.3, 1.2, 0.82),
  buildProvinceTile("aomen", "澳门", 113.3, 22.1, 1.2, 0.82),
];

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
  const provinceStats = useMemo(() => buildProvinceStats(spots), [spots]);

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
      if (mode === "country") {
        addCountryLayers(scene, provinceStats);
        return;
      }
      addCityPointLayer(scene, spots, selectedSpotId, onSpotSelect);
    });

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [mode, onSpotSelect, provinceStats, selectedSpotId, spots]);

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
      center: [105.2, 35.4] as [number, number],
      zoom: 3.15,
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
) {
  const provinceGeoJson = buildProvinceFeatureCollection(provinceStats);
  const polygonLayer = new PolygonLayer({ name: "checkin-province-tiles" })
    .source(provinceGeoJson)
    .shape("fill")
    .color("color")
    .style({
      opacity: 0.92,
      stroke: "#153457",
      strokeWidth: 1.4,
    });
  const labelLayer = new PointLayer({ name: "checkin-province-labels" })
    .source(buildProvinceLabelData(provinceStats), {
      parser: {
        type: "json",
        x: "lng",
        y: "lat",
      },
    })
    .shape("label", "text")
    .size(11)
    .color("labelColor")
    .style({
      opacity: 0.95,
      textAllowOverlap: true,
      textAnchor: "center",
      textOffset: [0, 0],
    });

  scene.addLayer(polygonLayer);
  scene.addLayer(labelLayer);
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
): ProvinceFeatureCollection {
  return {
    type: "FeatureCollection",
    features: PROVINCE_TILES.map((tile) => {
      const stat = provinceStats.get(tile.name);
      const count = stat?.count ?? 0;
      return {
        type: "Feature",
        properties: {
          cityCount: stat?.cityNames.size ?? 0,
          color: resolveProvinceColor(count),
          count,
          name: tile.name,
          statusText: count > 0 ? `${count} 个足迹` : "未解锁",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            tile.polygon.map((point) => [point.lng, point.lat]),
          ],
        },
      };
    }),
  };
}

function buildProvinceLabelData(
  provinceStats: Map<string, ProvinceStatistic>,
) {
  return PROVINCE_TILES.map((tile) => {
    const count = provinceStats.get(tile.name)?.count ?? 0;
    return {
      label: `${tile.name}\n${count > 0 ? count : "未解锁"}`,
      labelColor: count > 0 ? "#eaf4ff" : "#8090a7",
      lat: tile.center.lat,
      lng: tile.center.lng,
    };
  });
}

function buildProvinceTile(
  code: string,
  name: string,
  lng: number,
  lat: number,
  width = 3.4,
  height = 2.15,
): ProvinceTile {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return {
    center: { lng, lat },
    code,
    name,
    polygon: [
      { lng: lng - halfWidth, lat: lat - halfHeight },
      { lng: lng + halfWidth, lat: lat - halfHeight },
      { lng: lng + halfWidth, lat: lat + halfHeight },
      { lng: lng - halfWidth, lat: lat + halfHeight },
      { lng: lng - halfWidth, lat: lat - halfHeight },
    ],
  };
}

function resolveProvinceName(cityName: string) {
  return CITY_PROVINCE_MAP[cityName] ?? cityName.replace(/市$/, "");
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
