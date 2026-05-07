import { Alert, Spin } from "antd";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createBaiduPoint, loadBaiduMapGL } from "../../../lib/baiduMap";
import type { TravelCity, TravelSpot } from "../../../types/mapWorkbench";
import styles from "./BaiduMapStage.module.css";

interface BaiduMapStageProps {
  city: TravelCity;
  spots: TravelSpot[];
  selectedSpot?: TravelSpot;
  selectedSpotId?: number;
  onSelectSpot: (spotId: number) => void;
}

// BaiduMapStage 负责真实地图底图、城市定位和景点 Marker 展示。
export function BaiduMapStage({
  city,
  spots,
  selectedSpot,
  selectedSpotId,
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

    // 当前阶段景点数量有限，直接重绘 Marker 可以保证选中态与列表联动简单可靠。
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
    spots,
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

      <footer className={styles.mapStatus}>
        <span>已加载 {spots.length} 个景点点位</span>
        <span>
          当前选中：{selectedSpot?.name ?? selectedSpotSummary?.name ?? "暂无"}
        </span>
      </footer>

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
