import { EnvironmentOutlined } from "@ant-design/icons";
import { Scene, Map as L7Map, PointLayer } from "@antv/l7";
import { useEffect, useRef } from "react";
import type {
  CheckinSpotItemDto,
  GeoPoint,
  SpotType,
} from "../../../types/mapWorkbench";
import styles from "./CheckinL7FootprintMap.module.css";

const FOOTPRINT_MAP_STYLE = "dark";

interface CheckinL7FootprintMapProps {
  onSpotSelect: (spotId: number) => void;
  selectedSpotId?: number;
  spots: CheckinSpotItemDto[];
}

// CheckinL7FootprintMap 专注承载 AntV L7 地理可视化，页面层只负责传入打卡数据和选中状态。
export function CheckinL7FootprintMap({
  onSpotSelect,
  selectedSpotId,
  spots,
}: CheckinL7FootprintMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  // L7 场景依赖真实 DOM 容器；筛选、分页或选中变化时重建图层，保持地图与列表同步。
  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    sceneRef.current?.destroy();
    const center = resolveMapCenter(spots);
    const scene = new Scene({
      id: containerRef.current,
      map: new L7Map({
        center: [center.lng, center.lat],
        zoom: spots.length > 1 ? 9 : 11,
        pitch: 0,
        // 深色底图能压低道路和地名干扰，让打卡点、后续轨迹线更突出。
        style: FOOTPRINT_MAP_STYLE,
      }),
      logoVisible: false,
    });
    sceneRef.current = scene;

    scene.on("loaded", () => {
      if (spots.length === 0) {
        return;
      }

      const layerData = spots.map((spot) => ({
        ...spot,
        lng: spot.position.lng,
        lat: spot.position.lat,
        selected: spot.spotId === selectedSpotId ? 1 : 0,
        color: resolveSpotColor(spot.type),
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
        .size("selected", (selected: number) => (selected ? 24 : 16))
        .color("color")
        .style({
          opacity: 0.9,
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
    });

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [onSpotSelect, selectedSpotId, spots]);

  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapCanvas} ref={containerRef} />
      {spots.length === 0 ? (
        <div className={styles.mapEmpty}>
          <EnvironmentOutlined />
          <span>暂无可展示的打卡点</span>
        </div>
      ) : null}
      <div className={styles.mapLegend}>
        <span>
          <i className={styles.legendChecked} />
          已打卡景点
        </span>
        <span>
          <i className={styles.legendSelected} />
          当前选中
        </span>
      </div>
    </section>
  );
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
