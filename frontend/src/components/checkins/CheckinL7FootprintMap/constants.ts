import type { ProvinceViewConfig } from "./types";

export const FOOTPRINT_MAP_STYLE = "dark";

// 全国省级边界静态资源，避免足迹页运行时依赖地图 API。
export const CHINA_PROVINCES_GEOJSON_URL = "/geo/china-provinces.json";

// 省内市级边界静态资源目录，文件名按省级 adcode 命名。
export const PROVINCE_CITY_GEOJSON_BASE_URL = "/geo/provinces";

// 没有可用点位时的地图中心兜底坐标。
export const DEFAULT_MAP_CENTER = {
  lng: 104.066541,
  lat: 30.572269,
};

// 全国视图固定视口，保证中国地图初始展示完整。
export const COUNTRY_MAP_OPTIONS = {
  center: [104.6, 35.8] as [number, number],
  pitch: 0,
  zoom: 3.05,
};

// 已接入省份的视口微调配置，后续新增省份时在这里补充。
export const PROVINCE_VIEW_CONFIG: Record<string, ProvinceViewConfig> = {
  "510000": { center: [102.7, 30.6], zoom: 5.7 },
  "610000": { center: [108.9, 35.2], zoom: 6.35 },
};

// 足迹数量到色值的分级映射，替代散落的 if/else 颜色逻辑。
export const PROVINCE_COLOR_LEVELS = [
  { max: 0, color: "#243149" },
  { max: 3, color: "#2a82ff" },
  { max: 9, color: "#00b8a9" },
  { max: Number.POSITIVE_INFINITY, color: "#ff9f24" },
];

// 当前城市数据未覆盖完整行政层级，先用映射辅助城市归属省份。
export const CITY_PROVINCE_MAP: Record<string, string> = {
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
