import { Alert, Spin } from "antd";
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
  onSelectSpot,
  onPickStartPoint,
}: BaiduMapStageProps) {
  const containerId = useId().replace(/:/g, "-");
  const mapRef = useRef<BMapGLMap | null>(null);
  const routeViewportSignatureRef = useRef<string | undefined>(undefined);
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
        mapRef.current = map;
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
    map.clearOverlays();

    // 当前阶段景点数量有限，直接重绘 Marker、轮廓和路线线条可以保证联动逻辑简单可靠。
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
    });
    // 起点选点模式下，如果已有选定的起点位置，则在地图上展示一个特殊标识，提示用户当前选点状态和已选位置。
    if (startPointPosition) {
      map.addOverlay(
        new window.BMapGL!.Marker(createBaiduPoint(startPointPosition), {
          icon: createStartPointIcon(),
        }),
      );
    }

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

      // 每条路线补充轻量端点标识，帮助用户区分当前路段从哪里出发、到哪里结束。
      const firstPoint = displayPolyline[0];
      const lastPoint = displayPolyline[displayPolyline.length - 1];
      map.addOverlay(
        new window.BMapGL!.Marker(createBaiduPoint(firstPoint), {
          icon: createRouteEndpointIcon("起", overlay.color, overlay.kind),
        }),
      );
      map.addOverlay(
        new window.BMapGL!.Marker(createBaiduPoint(lastPoint), {
          icon: createRouteEndpointIcon("到", overlay.color, overlay.kind),
        }),
      );
    });

    itineraryMarkers?.forEach((marker) => {
      const overlay = new window.BMapGL!.Marker(
        createBaiduPoint(marker.position),
        {
          icon: createActivityMarkerIcon(marker.itemType),
        },
      );
      map.addOverlay(overlay);
    });

    const routeViewportSignature = buildRouteViewportSignature(activeRouteOverlays);
    if (routeViewportPoints.length >= 2 && routeViewportSignature !== routeViewportSignatureRef.current) {
      routeViewportSignatureRef.current = routeViewportSignature;
      map.setViewport(routeViewportPoints);
      return;
    }

    if (routeViewportPoints.length < 2) {
      routeViewportSignatureRef.current = undefined;
    }

    // 选中景点如果带有轮廓，则优先画面并缩放到该区域；否则使用中等缩放聚焦主点位。
    if (selectedSpot?.boundary && selectedSpot.boundary.length >= 3) {
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
      map.setViewport(boundaryPoints);
      return;
    }

    if (selectedSpotSummary) {
      // 城市默认保持全景视角，选中景点后适当放大，方便查看具体位置。
      map.centerAndZoom(
        createBaiduPoint(selectedSpotSummary.position),
        selectedSpotZoom,
      );
    }
  }, [
    onSelectSpot,
    sdkReady,
    selectedSpot,
    selectedSpotId,
    selectedSpotSummary,
    selectedSpotZoom,
    routeSegments,
    routeOverlays,
    spots,
    startPointPicking,
    startPointPosition,
    itineraryMarkers,
    onPickStartPoint,
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

  if (sdkError) {
    return (
      <section
        className={styles.mapStage}
        aria-label={`${city.name} 百度地图加载失败`}
      >
        <div className={styles.overlayShell}>
          <Alert
            type="error"
            showIcon
            message="百度地图加载失败"
            description={sdkError}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.mapStage} aria-label={`${city.name} 百度地图`}>
      <div className={styles.mapContainer} id={containerId} />

      {startPointPicking ? (
        <div className={styles.pickHint}>
          <strong>可直接点击地图选点</strong>
          <span>选择后会自动回填到底部起点输入框</span>
        </div>
      ) : null}

      {!sdkReady ? (
        <div className={styles.loadingMask}>
          <Spin size="large" />
          <p>正在加载百度地图...</p>
        </div>
      ) : null}
    </section>
  );
}

// 用内联 SVG 生成两套 Marker 图标，避免额外引入静态图片资源。
function createMarkerIcon(selected: boolean) {
  const primaryColor = selected ? "#1f6aff" : "#203550";
  const ringColor = selected ? "#dbe8ff" : "#ffffff";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <path d="M15 1C8.37 1 3 6.37 3 13c0 9.48 12 23 12 23s12-13.52 12-23C27 6.37 21.63 1 15 1z" fill="${primaryColor}"/>
      <circle cx="15" cy="13" r="5.5" fill="${ringColor}"/>
    </svg>
  `;

  return new window.BMapGL!.Icon(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.BMapGL!.Size(30, 38),
    {
      anchor: new window.BMapGL!.Size(15, 38),
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
