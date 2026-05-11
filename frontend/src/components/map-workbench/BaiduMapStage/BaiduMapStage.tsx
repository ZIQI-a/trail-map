import { Alert, Spin } from "antd";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createBaiduPoint, loadBaiduMapGL } from "../../../lib/baiduMap";
import type {
  GeoPoint,
  RouteSegmentDto,
  TravelCity,
  TravelSpot,
} from "../../../types/mapWorkbench";
import { getItineraryActivityMarkerConfig, getRouteSegmentColor } from "../../../utils/map-workbench/routePalette";
import styles from "./BaiduMapStage.module.css";

interface BaiduMapStageProps {
  city: TravelCity;
  spots: TravelSpot[];
  selectedSpot?: TravelSpot;
  selectedSpotId?: number;
  routeSegments?: RouteSegmentDto[];
  routeOverlays?: MapRouteOverlay[];
  itineraryMarkers?: MapItineraryMarker[];
  onSelectSpot: (spotId: number) => void;
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

// BaiduMapStage 负责真实地图底图、城市定位和景点 Marker 展示。
export function BaiduMapStage({
  city,
  spots,
  selectedSpot,
  selectedSpotId,
  routeSegments,
  routeOverlays,
  itineraryMarkers,
  onSelectSpot,
}: BaiduMapStageProps) {
  const containerId = useId().replace(/:/g, "-");
  const mapRef = useRef<BMapGLMap | null>(null);
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
      marker.addEventListener("click", () => onSelectSpot(spot.id));
      map.addOverlay(marker);
    });

    const activeRouteOverlays =
      routeOverlays?.length
        ? routeOverlays
        : routeSegments?.map((segment, index) => ({
            key: `segment-${segment.segmentIndex}`,
            polyline: segment.polyline,
            color: getRouteSegmentColor(index),
            lineStyle: "solid" as const,
            kind: "route" as const,
          })) ?? [];

    const routeViewportPoints =
      activeRouteOverlays.flatMap((overlay) => overlay.polyline).map(createBaiduPoint);

    activeRouteOverlays.forEach((overlay) => {
      if (overlay.polyline.length < 2) {
        return;
      }
      const routeLine = new window.BMapGL!.Polyline(
        overlay.polyline.map(createBaiduPoint),
        ({
          strokeColor: overlay.color,
          strokeWeight: overlay.kind === "guide" ? 4 : 5,
          strokeOpacity: overlay.kind === "guide" ? 0.72 : 0.88,
          strokeStyle: overlay.lineStyle,
        } as unknown as {
          strokeColor?: string;
          strokeWeight?: number;
          strokeOpacity?: number;
        }),
      );
      map.addOverlay(routeLine);
    });

    itineraryMarkers?.forEach((marker) => {
      const overlay = new window.BMapGL!.Marker(createBaiduPoint(marker.position), {
        icon: createActivityMarkerIcon(marker.itemType),
      });
      map.addOverlay(overlay);
    });

    if (routeViewportPoints.length >= 2) {
      map.setViewport(routeViewportPoints);
      return;
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
    itineraryMarkers,
  ]);

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
