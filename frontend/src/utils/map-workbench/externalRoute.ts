import type {
  RouteSegmentDto,
  TransportType,
} from "../../types/mapWorkbench";

export type ExternalMapProvider = "baidu" | "amap";

const BAIDU_MODE_MAPPING: Partial<Record<TransportType, string>> = {
  transit: "transit",
  driving: "driving",
  walking: "walking",
};

const AMAP_MODE_MAPPING: Record<TransportType, string> = {
  transit: "bus",
  driving: "car",
  walking: "walk",
  bicycling: "ride",
};

/**
 * 根据路线分段生成地图网站的官方 URI。
 * 项目路线坐标统一为 GCJ-02：高德直接使用，百度通过 coord_type 明确声明。
 */
export function buildExternalRouteUrl(
  provider: ExternalMapProvider,
  segment: RouteSegmentDto,
  cityName: string,
) {
  validateSegmentPosition(segment);
  return provider === "baidu"
    ? buildBaiduRouteUrl(segment, cityName)
    : buildAmapRouteUrl(segment);
}

/**
 * 判断指定交通方式是否能通过对应地图的官方网页 URI 打开。
 */
export function supportsExternalRoute(
  provider: ExternalMapProvider,
  transportType: TransportType,
) {
  return provider === "amap" || transportType !== "bicycling";
}

/**
 * 构造百度地图官方路线调起地址，坐标顺序按百度要求使用纬度、经度。
 */
function buildBaiduRouteUrl(segment: RouteSegmentDto, cityName: string) {
  const mode = BAIDU_MODE_MAPPING[segment.transportType];
  if (!mode) {
    throw new Error("百度地图网页暂不支持当前交通方式");
  }

  const params = new URLSearchParams({
    origin: `latlng:${formatCoordinate(segment.fromPosition.lat)},${formatCoordinate(segment.fromPosition.lng)}|name:${normalizePlaceName(segment.fromName, "路线起点")}`,
    destination: `latlng:${formatCoordinate(segment.toPosition.lat)},${formatCoordinate(segment.toPosition.lng)}|name:${normalizePlaceName(segment.toName, "路线终点")}`,
    mode,
    region: cityName,
    coord_type: "gcj02",
    output: "html",
    src: "webapp.trailmap.route",
  });

  return `https://api.map.baidu.com/direction?${params.toString()}`;
}

/**
 * 构造高德地图官方路线调起地址，坐标顺序使用经度、纬度。
 */
function buildAmapRouteUrl(segment: RouteSegmentDto) {
  const params = new URLSearchParams({
    from: `${formatCoordinate(segment.fromPosition.lng)},${formatCoordinate(segment.fromPosition.lat)},${normalizePlaceName(segment.fromName, "路线起点")}`,
    to: `${formatCoordinate(segment.toPosition.lng)},${formatCoordinate(segment.toPosition.lat)},${normalizePlaceName(segment.toName, "路线终点")}`,
    mode: AMAP_MODE_MAPPING[segment.transportType],
    policy: "0",
    src: "trailmap",
    callnative: "0",
  });

  return `https://uri.amap.com/navigation?${params.toString()}`;
}

/**
 * 校验路线分段坐标，避免生成包含 NaN 或 Infinity 的无效外链。
 */
function validateSegmentPosition(segment: RouteSegmentDto) {
  const coordinates = [
    segment.fromPosition.lng,
    segment.fromPosition.lat,
    segment.toPosition.lng,
    segment.toPosition.lat,
  ];
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    throw new Error("路线坐标无效，暂时无法打开外部地图");
  }
}

/**
 * 将坐标限制为地图 URI 常用的六位小数，兼顾精度和链接长度。
 */
function formatCoordinate(coordinate: number) {
  return coordinate.toFixed(6);
}

/**
 * 清理地点展示名称；坐标负责准确定位，名称仅用于地图页面展示。
 */
function normalizePlaceName(placeName: string, fallbackName: string) {
  return placeName.trim() || fallbackName;
}
