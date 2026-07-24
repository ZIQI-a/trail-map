import { WarningOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createBaiduPoint, loadBaiduMapGL } from "../../../lib/baiduMap";
import type {
  GeoPoint,
  RouteSegmentDto,
  TravelCity,
  TravelSpot,
} from "../../../types/mapWorkbench";
import { bd09ToGcj02 } from "../../../utils/map-workbench/coordinate";
import {
  getItineraryActivityMarkerConfig,
  getRouteSegmentColor,
} from "../../../utils/map-workbench/routePalette";
import styles from "./BaiduMapStage.module.css";

interface BaiduMapStageProps {
  city: TravelCity;
  spots: TravelSpot[];
  selectedSpot?: TravelSpot;
  selectedSpotId?: number;
  routeSegments?: RouteSegmentDto[];
  routeOverlays?: MapRouteOverlay[];
  itineraryMarkers?: MapItineraryMarker[];
  focusTarget?: MapFocusTarget; // 右侧时间轴点击时的地图聚焦目标，优先级高于 selectedSpot。
  startPointPicking: boolean;
  startPointPosition?: GeoPoint;
  currentLocationPosition?: GeoPoint;
  onSelectSpot: (spotId: number) => void;
  onPickStartPoint: (target: MapPickedStartPoint) => void;
}

interface MapRouteOverlay {
  key: string;
  polyline: GeoPoint[];
  color: string;
  lineStyle: "solid" | "dashed";
  kind: "route" | "guide";
}

interface MapItineraryMarker {
  key: string;
  position: GeoPoint;
  itemType: "lunch" | "rest" | "hotel";
  title: string;
}

interface MapFocusTarget {
  key: string;
  position: GeoPoint;
  zoom?: number;
}

interface MapPickedStartPoint {
  name: string;
  position: GeoPoint;
}

// BaiduMapStage 负责真实地图底图、城市定位和景点 Marker 展示。
export function BaiduMapStage({
  city,
  spots,
  selectedSpot,
  selectedSpotId,
  routeSegments,
  routeOverlays,
  itineraryMarkers,
  focusTarget,
  startPointPicking,
  startPointPosition,
  currentLocationPosition,
  onSelectSpot,
  onPickStartPoint,
}: BaiduMapStageProps) {
  const containerId = useId().replace(/:/g, "-");
  const mapRef = useRef<BMapGLMap | null>(null);
  const spotOverlayRef = useRef<unknown[]>([]);
  const routeOverlayRef = useRef<unknown[]>([]);
  const utilityOverlayRef = useRef<unknown[]>([]);
  const boundaryOverlayRef = useRef<unknown[]>([]);
  const routeViewportSignatureRef = useRef<string | undefined>(undefined);
  const currentZoomRef = useRef(city.mapZoom);
  const [sdkError, setSdkError] = useState<string>();
  const [sdkReady, setSdkReady] = useState(false);
  const selectedSpotSummary = useMemo(
    () => spots.find((spot) => spot.id === selectedSpotId),
    [selectedSpotId, spots],
  );
  // 计算选中景点时的缩放级别, 保持在 15-16 之间，兼顾城市默认视角和景点位置细节。
  const selectedSpotZoom = useMemo(
    () => Math.min(Math.max(city.mapZoom + 4, 15), 16),
    [city.mapZoom],
  );
  useEffect(() => {
    let cancelled = false;

    // 地图只初始化一次，后续城市切换和点位刷新走单独 effect 同步。
    loadBaiduMapGL()
      .then((BMapGL) => {
        if (cancelled || mapRef.current) {
          return;
        }

        const map = new BMapGL.Map(containerId);
        map.centerAndZoom(createBaiduPoint(city.center), city.mapZoom);
        map.enableScrollWheelZoom(true);
        map.addControl(new BMapGL.NavigationControl());
        map.addControl(new BMapGL.ScaleControl());
        map.addEventListener("zoomend", () => {
          currentZoomRef.current = map.getZoom();
        });
        mapRef.current = map;
        currentZoomRef.current = city.mapZoom;
        setSdkReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setSdkError(
            error instanceof Error ? error.message : "百度地图加载失败",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [city.center, city.mapZoom, containerId]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady) {
      return;
    }

    // 城市切换时回到后端提供的城市中心点和默认缩放级别。
    mapRef.current.centerAndZoom(createBaiduPoint(city.center), city.mapZoom);
  }, [city.center, city.mapZoom, sdkReady]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || !window.BMapGL) {
      return;
    }

    const map = mapRef.current;
    clearOverlayGroup(map, spotOverlayRef);

    // 景点锚点与路线覆盖物解耦更新，避免选中景点或定位变化时整张图全量重绘。
    spots.forEach((spot) => {
      const marker = new window.BMapGL!.Marker(
        createBaiduPoint(spot.position),
        {
          icon: createMarkerIcon(spot.id === selectedSpotId),
        },
      );
      marker.addEventListener("click", () => {
        if (startPointPicking) {
          onPickStartPoint({ name: spot.name, position: spot.position });
          return;
        }

        onSelectSpot(spot.id);
      });
      map.addOverlay(marker);
      spotOverlayRef.current.push(marker);
    });
  }, [
    onPickStartPoint,
    onSelectSpot,
    sdkReady,
    selectedSpotId,
    spots,
    startPointPicking,
  ]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || !window.BMapGL) {
      return;
    }

    const map = mapRef.current;
    clearOverlayGroup(map, utilityOverlayRef);

    // 起点选点模式下，如果已有选定的起点位置，则在地图上展示一个特殊标识，提示用户当前选点状态和已选位置。
    if (startPointPosition) {
      const startMarker = new window.BMapGL!.Marker(
        createBaiduPoint(startPointPosition),
        {
          icon: createStartPointIcon(),
        },
      );
      map.addOverlay(startMarker);
      utilityOverlayRef.current.push(startMarker);
    }

    // 顶部“我的位置”定位成功后展示导航样式锚点，帮助用户在地图上识别当前位置。
    if (currentLocationPosition) {
      const currentLocationMarker = new window.BMapGL!.Marker(
        createBaiduPoint(currentLocationPosition),
        {
          icon: createCurrentLocationIcon(),
        },
      );
      map.addOverlay(currentLocationMarker);
      utilityOverlayRef.current.push(currentLocationMarker);
    }
  }, [currentLocationPosition, sdkReady, startPointPosition]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || !window.BMapGL) {
      return;
    }

    const map = mapRef.current;
    clearOverlayGroup(map, routeOverlayRef);

    const activeRouteOverlays = routeOverlays?.length
      ? routeOverlays
      : (routeSegments?.map((segment, index) => ({
          key: `segment-${segment.segmentIndex}`,
          polyline: segment.polyline,
          color: getRouteSegmentColor(index),
          lineStyle: "solid" as const,
          kind: "route" as const,
        })) ?? []);

    const routeViewportPoints = activeRouteOverlays
      .flatMap((overlay) => overlay.polyline)
      .map(createBaiduPoint);

    activeRouteOverlays.forEach((overlay, index) => {
      if (overlay.polyline.length < 2) {
        return;
      }
      const displayPolyline = offsetRoutePolyline(
        overlay.polyline,
        index,
        activeRouteOverlays.length,
      );
      const routePoints = displayPolyline.map(createBaiduPoint);
      const casingLine = new window.BMapGL!.Polyline(routePoints, {
        strokeColor: "#ffffff",
        strokeWeight: overlay.kind === "guide" ? 8 : 10,
        strokeOpacity: overlay.kind === "guide" ? 0.78 : 0.86,
        strokeStyle: overlay.lineStyle,
      } as unknown as {
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
      });
      const routeLine = new window.BMapGL!.Polyline(routePoints, {
        strokeColor: overlay.color,
        strokeWeight: overlay.kind === "guide" ? 4 : 6,
        strokeOpacity: overlay.kind === "guide" ? 0.78 : 0.92,
        strokeStyle: overlay.lineStyle,
      } as unknown as {
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
      });
      map.addOverlay(casingLine);
      map.addOverlay(routeLine);
      routeOverlayRef.current.push(casingLine, routeLine);
      // 沿着路线追加一组轻量箭头，帮助用户快速判断路线方向，而不改变主线本身的样式。
      const arrowMarkers = buildRouteArrowMarkers(
        displayPolyline,
        resolveRouteArrowIntervalMeters(currentZoomRef.current, overlay.kind),
      );
      arrowMarkers.forEach((arrowMarker, arrowIndex) => {
        const arrowOverlay = new window.BMapGL!.Marker(
          createBaiduPoint(arrowMarker.position),
          {
            icon: createRouteArrowIcon(
              arrowMarker.angleDeg,
              overlay.kind,
              `${overlay.key}-${arrowIndex}`,
            ),
          },
        );
        map.addOverlay(arrowOverlay);
        routeOverlayRef.current.push(arrowOverlay);
      });

      // 每条路线补充轻量端点标识，帮助用户区分当前路段从哪里出发、到哪里结束。
      const firstPoint = displayPolyline[0];
      const lastPoint = displayPolyline[displayPolyline.length - 1];
      const startOverlay = new window.BMapGL!.Marker(
        createBaiduPoint(firstPoint),
        {
          icon: createRouteEndpointIcon("起", overlay.color, overlay.kind),
        },
      );
      const endOverlay = new window.BMapGL!.Marker(
        createBaiduPoint(lastPoint),
        {
          icon: createRouteEndpointIcon("到", overlay.color, overlay.kind),
        },
      );
      map.addOverlay(startOverlay);
      map.addOverlay(endOverlay);
      routeOverlayRef.current.push(startOverlay, endOverlay);
    });

    itineraryMarkers?.forEach((marker) => {
      const overlay = new window.BMapGL!.Marker(
        createBaiduPoint(marker.position),
        {
          icon: createActivityMarkerIcon(marker.itemType),
        },
      );
      map.addOverlay(overlay);
      routeOverlayRef.current.push(overlay);
    });

    const routeViewportSignature = buildRouteViewportSignature(activeRouteOverlays);
    if (routeViewportPoints.length >= 2 && routeViewportSignature !== routeViewportSignatureRef.current) {
      routeViewportSignatureRef.current = routeViewportSignature;
      map.setViewport(routeViewportPoints);
      return;
    }

    // 只要当前存在路线结果，后续缩放和重绘都不应再被“选中景点自动聚焦”抢回去。
    // 否则用户滚轮缩放地图时，会因为当前默认有选中景点而被强制拉回景点视角。
    if (routeViewportPoints.length >= 2) {
      return;
    }

    if (routeViewportPoints.length < 2) {
      routeViewportSignatureRef.current = undefined;
    }
  }, [itineraryMarkers, routeOverlays, routeSegments, sdkReady]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || !window.BMapGL) {
      return;
    }

    const map = mapRef.current;
    clearOverlayGroup(map, boundaryOverlayRef);
    const hasActiveRoute = routeViewportSignatureRef.current != null;

    // 选中景点如果带有轮廓，则优先画面并缩放到该区域；否则使用中等缩放聚焦主点位。
    if (!hasActiveRoute && selectedSpot?.boundary && selectedSpot.boundary.length >= 3) {
      const boundaryPoints = selectedSpot.boundary.map(createBaiduPoint);
      const polygon = new window.BMapGL!.Polygon(boundaryPoints, {
        strokeColor: "#1f6aff",
        strokeWeight: 3,
        strokeOpacity: 0.95,
        fillColor: "#1f6aff",
        fillOpacity: 0.18,
      });
      polygon.addEventListener("click", () => onSelectSpot(selectedSpot.id));
      map.addOverlay(polygon);
      boundaryOverlayRef.current.push(polygon);
      map.setViewport(boundaryPoints);
      return;
    }

    if (!hasActiveRoute && selectedSpotSummary) {
      // 城市默认保持全景视角，选中景点后适当放大，方便查看具体位置。
      map.centerAndZoom(
        createBaiduPoint(selectedSpotSummary.position),
        selectedSpotZoom,
      );
    }
  }, [
    sdkReady,
    selectedSpot,
    selectedSpotSummary,
    selectedSpotZoom,
    onSelectSpot,
  ]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || !focusTarget) {
      return;
    }

    // 右侧时间轴点击地点时，地图只做视角聚焦，不触发路线重绘。
    mapRef.current.centerAndZoom(
      createBaiduPoint(focusTarget.position),
      focusTarget.zoom ?? selectedSpotZoom,
    );
  }, [focusTarget, sdkReady, selectedSpotZoom]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || !window.BMapGL || !startPointPicking) {
      return;
    }

    const map = mapRef.current;
    // 起点选点模式只监听地图点击；点击后由页面层回填输入框并退出选点模式。
    const handlePickStartPoint = (event: BMapGLMapClickEvent) => {
      const point = event.latlng ?? event.point;
      if (!point) {
        return;
      }

      const position = bd09ToGcj02({ lng: point.lng, lat: point.lat });
      const fallbackName = `地图选点 ${position.lng.toFixed(6)}, ${position.lat.toFixed(6)}`;

      try {
        const geocoder = new window.BMapGL!.Geocoder();
        geocoder.getLocation(point, (result) => {
          onPickStartPoint({
            name: resolvePickedStartPointName(result, fallbackName),
            position,
          });
        });
      } catch {
        onPickStartPoint({ name: fallbackName, position });
      }
    };

    map.addEventListener("click", handlePickStartPoint);
    return () => map.removeEventListener("click", handlePickStartPoint);
  }, [onPickStartPoint, sdkReady, startPointPicking]);

  return (
    <section className={styles.mapStage} aria-label={`${city.name} 百度地图`}>
      <div className={styles.mapContainer} id={containerId} />

      {sdkError ? (
        <div className={styles.mapErrorBadge} role="status" title={sdkError}>
          <WarningOutlined />
          <span>地图服务暂时不可用，请稍后重试</span>
        </div>
      ) : null}

      {startPointPicking ? (
        <div className={styles.pickHint}>
          <strong>可直接点击地图选点</strong>
          <span>选择后会自动回填到底部起点输入框</span>
        </div>
      ) : null}

      {!sdkReady && !sdkError ? (
        <div className={styles.loadingMask}>
          <Spin size="large" />
          <p>正在加载百度地图...</p>
        </div>
      ) : null}
    </section>
  );
}

/**
 * 只清理指定分组的覆盖物，避免景点锚点和路线线条彼此干扰导致整图全量重绘。
 */
function clearOverlayGroup(map: BMapGLMap, overlayRef: { current: unknown[] }) {
  overlayRef.current.forEach((overlay) => {
    map.removeOverlay(overlay);
  });
  overlayRef.current = [];
}

// 用内联 SVG 生成景点锚点图标，避免额外引入静态图片资源。
function createMarkerIcon(selected: boolean) {
  const primaryColor = selected ? "#ff7aa2" : "#6ea8ff";
  const highlightColor = selected ? "#ffd6e4" : "#dff0ff";
  const innerRingColor = selected ? "#fff1f6" : "#f4fbff";
  const innerDotColor = selected ? "#ff6a95" : "#4d88e6";
  const shadowColor = selected
    ? "rgba(255, 122, 162, 0.24)"
    : "rgba(110, 168, 255, 0.22)";
  const strokeColor = "#ffffff";
  const width = 34;
  const height = 46;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <ellipse cx="17" cy="41.5" rx="8" ry="3.5" fill="${shadowColor}"/>
      <path d="M17 2C9.82 2 4 7.82 4 15c0 10.86 10.2 20.3 12.17 22a1.2 1.2 0 0 0 1.66 0C19.8 35.3 30 25.86 30 15 30 7.82 24.18 2 17 2z" fill="${primaryColor}"/>
      <path d="M17 4.6c5.74 0 10.4 4.66 10.4 10.4 0 8.62-7.89 16.46-10.4 18.72C14.49 31.46 6.6 23.62 6.6 15 6.6 9.26 11.26 4.6 17 4.6z" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-opacity="0.92"/>
      <circle cx="13.2" cy="10.8" r="3.1" fill="${highlightColor}" fill-opacity="0.9" />
      <circle cx="17" cy="15" r="6.6" fill="${innerRingColor}" />
      <circle cx="17" cy="15" r="3.2" fill="${innerDotColor}" />
      <path d="M12.4 10.1c1.08-.92 2.35-1.42 3.86-1.42 1.16 0 2.23.26 3.23.82" fill="none" stroke="rgba(255,255,255,0.78)" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M14.3 22.8c1.18 1.18 3.18 1.18 4.36 0" fill="none" stroke="rgba(255,255,255,0.62)" stroke-width="1.1" stroke-linecap="round"/>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.BMapGL!.Size(width, height),
    {
      anchor: new window.BMapGL!.Size(Math.round(width / 2), height - 8),
    },
  );
}

function createStartPointIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
      <path d="M17 2C9.27 2 3 8.27 3 16c0 10.8 14 24 14 24s14-13.2 14-24C31 8.27 24.73 2 17 2z" fill="#16a35f"/>
      <circle cx="17" cy="16" r="8" fill="#ffffff"/>
      <text x="17" y="20" text-anchor="middle" font-size="10" font-weight="900" fill="#16a35f">起</text>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.BMapGL!.Size(34, 42),
    {
      anchor: new window.BMapGL!.Size(17, 42),
    },
  );
}

function createCurrentLocationIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <circle cx="21" cy="21" r="17" fill="#1677ff" fill-opacity="0.16">
        <animate attributeName="r" values="12;18;12" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.22;0.06;0.22" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="21" cy="21" r="10" fill="#1677ff" stroke="#ffffff" stroke-width="4"/>
      <circle cx="21" cy="21" r="4" fill="#ffffff"/>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.BMapGL!.Size(42, 42),
    {
      anchor: new window.BMapGL!.Size(21, 21),
    },
  );
}

function createActivityMarkerIcon(itemType: MapItineraryMarker["itemType"]) {
  const config = resolveActivityMarkerConfig(itemType);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="11" fill="${config.fill}" />
      <circle cx="13" cy="13" r="11" stroke="${config.ring}" stroke-width="2" fill="none" />
      <text x="13" y="17" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">${config.label}</text>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.BMapGL!.Size(26, 26),
    {
      anchor: new window.BMapGL!.Size(13, 13),
    },
  );
}

function resolveActivityMarkerConfig(itemType: MapItineraryMarker["itemType"]) {
  return getItineraryActivityMarkerConfig(itemType);
}

function resolvePickedStartPointName(
  result: BMapGLGeocoderResult | undefined,
  fallbackName: string,
) {
  const poiTitle = result?.surroundingPois?.find((poi) => poi.title)?.title;
  if (poiTitle) {
    return poiTitle;
  }

  if (result?.address) {
    return result.address;
  }

  const components = result?.addressComponents;
  const composedAddress = components
    ? [
        components.city,
        components.district,
        components.street,
        components.streetNumber,
      ]
        .filter(Boolean)
        .join("")
    : "";

  return composedAddress || fallbackName;
}

function buildRouteViewportSignature(overlays: MapRouteOverlay[]) {
  return overlays
    .map((overlay) => {
      const firstPoint = overlay.polyline[0];
      const lastPoint = overlay.polyline[overlay.polyline.length - 1];
      return [
        overlay.key,
        overlay.polyline.length,
        formatSignaturePoint(firstPoint),
        formatSignaturePoint(lastPoint),
      ].join(":");
    })
    .join("|");
}

function formatSignaturePoint(point: GeoPoint | undefined) {
  if (!point) {
    return "empty";
  }

  return `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`;
}

/**
 * 路线展示偏移只影响前端视觉，不回写真实路线坐标；用于缓解多条路线完全重合时看不清的问题。
 */
function offsetRoutePolyline(
  polyline: GeoPoint[],
  routeIndex: number,
  routeCount: number,
) {
  if (polyline.length < 2 || routeCount <= 1) {
    return polyline;
  }

  const offsetLevel = (routeIndex % 5) - Math.min(routeCount - 1, 4) / 2;
  const offsetDistance = offsetLevel * 0.000035;
  if (Math.abs(offsetDistance) < 0.000001) {
    return polyline;
  }

  return polyline.map((point, pointIndex) => {
    const previousPoint = polyline[Math.max(0, pointIndex - 1)];
    const nextPoint = polyline[Math.min(polyline.length - 1, pointIndex + 1)];
    const deltaLng = nextPoint.lng - previousPoint.lng;
    const deltaLat = nextPoint.lat - previousPoint.lat;
    const vectorLength = Math.hypot(deltaLng, deltaLat);

    if (vectorLength === 0) {
      return point;
    }

    return {
      lng: point.lng + (-deltaLat / vectorLength) * offsetDistance,
      lat: point.lat + (deltaLng / vectorLength) * offsetDistance,
    };
  });
}

function createRouteEndpointIcon(
  label: "起" | "到",
  color: string,
  kind: MapRouteOverlay["kind"],
) {
  const size = kind === "guide" ? 20 : 24;
  const radius = kind === "guide" ? 8 : 9.5;
  const fontSize = kind === "guide" ? 9 : 10;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius + 3}" fill="#ffffff" fill-opacity="0.92"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${color}" fill-opacity="${kind === "guide" ? "0.82" : "0.96"}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#ffffff" stroke-width="2" fill="none"/>
      <text x="${size / 2}" y="${size / 2 + 3.5}" text-anchor="middle" font-size="${fontSize}" font-weight="800" fill="#ffffff">${label}</text>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.BMapGL!.Size(size, size),
    {
      anchor: new window.BMapGL!.Size(size / 2, size / 2),
    },
  );
}

interface RouteArrowMarker {
  position: GeoPoint;
  angleDeg: number;
}

function buildRouteArrowMarkers(
  polyline: GeoPoint[],
  intervalMeters: number,
): RouteArrowMarker[] {
  if (polyline.length < 2) {
    return [];
  }

  const totalLength = calculatePolylineLength(polyline);
  if (totalLength < Math.max(220, intervalMeters * 0.8)) {
    const middleIndex = Math.floor((polyline.length - 1) / 2);
    return [
      {
        position: interpolatePoint(polyline[middleIndex], polyline[middleIndex + 1] ?? polyline[middleIndex], 0.5),
        angleDeg: calculateBearing(polyline[middleIndex], polyline[middleIndex + 1] ?? polyline[middleIndex]),
      },
    ];
  }

  const markers: RouteArrowMarker[] = [];
  let nextDistance = Math.min(intervalMeters, totalLength / 2);
  let walkedDistance = 0;

  for (let index = 1; index < polyline.length && nextDistance < totalLength; index += 1) {
    const fromPoint = polyline[index - 1];
    const toPoint = polyline[index];
    const segmentDistance = calculatePointDistanceMeters(fromPoint, toPoint);
    if (segmentDistance <= 0) {
      continue;
    }

    while (walkedDistance + segmentDistance >= nextDistance && nextDistance < totalLength) {
      const ratio = (nextDistance - walkedDistance) / segmentDistance;
      markers.push({
        position: interpolatePoint(fromPoint, toPoint, ratio),
        angleDeg: calculateBearing(fromPoint, toPoint),
      });
      nextDistance += intervalMeters;
    }

    walkedDistance += segmentDistance;
  }

  return markers.slice(0, 8);
}

function createRouteArrowIcon(
  angleDeg: number,
  kind: MapRouteOverlay["kind"],
  cacheKey: string,
) {
  const arrowSize = kind === "guide" ? 12 : 14;
  const strokeWidth = kind === "guide" ? 1.8 : 2;
  const shadowOpacity = kind === "guide" ? 0.22 : 0.28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${arrowSize}" height="${arrowSize}" viewBox="0 0 16 16">
      <g transform="rotate(${angleDeg}, 8, 8)">
        <path d="M5.5 4.5L9.5 8L5.5 11.5" fill="none" stroke="rgba(0,0,0,${shadowOpacity})" stroke-width="${strokeWidth + 1}" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M5.5 4.5L9.5 8L5.5 11.5" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}#${encodeURIComponent(cacheKey)}`,
    new window.BMapGL!.Size(arrowSize, arrowSize),
    {
      anchor: new window.BMapGL!.Size(
        Math.round(arrowSize / 2),
        Math.round(arrowSize / 2),
      ),
    },
  );
}

function resolveRouteArrowIntervalMeters(
  currentZoom: number,
  kind: MapRouteOverlay["kind"],
) {
  const baseInterval = kind === "guide" ? 420 : 520;
  if (currentZoom >= 16) {
    return Math.round(baseInterval * 0.7);
  }
  if (currentZoom >= 14) {
    return baseInterval;
  }
  if (currentZoom >= 12) {
    return Math.round(baseInterval * 1.45);
  }
  return Math.round(baseInterval * 2.1);
}

function calculatePolylineLength(polyline: GeoPoint[]) {
  let totalDistance = 0;
  for (let index = 1; index < polyline.length; index += 1) {
    totalDistance += calculatePointDistanceMeters(polyline[index - 1], polyline[index]);
  }
  return totalDistance;
}

function calculatePointDistanceMeters(fromPoint: GeoPoint, toPoint: GeoPoint) {
  const earthRadius = 6371000;
  const lat1 = toRadians(fromPoint.lat);
  const lat2 = toRadians(toPoint.lat);
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(toPoint.lng - fromPoint.lng);
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function interpolatePoint(fromPoint: GeoPoint, toPoint: GeoPoint, ratio: number): GeoPoint {
  return {
    lng: fromPoint.lng + (toPoint.lng - fromPoint.lng) * ratio,
    lat: fromPoint.lat + (toPoint.lat - fromPoint.lat) * ratio,
  };
}

function calculateBearing(fromPoint: GeoPoint, toPoint: GeoPoint) {
  const deltaLng = toPoint.lng - fromPoint.lng;
  const deltaLat = toPoint.lat - fromPoint.lat;
  return (Math.atan2(deltaLat, deltaLng) * 180) / Math.PI;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
