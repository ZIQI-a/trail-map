import { AimOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Alert, Button, Modal, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { createBaiduPoint, loadBaiduMapGL } from "../../../lib/baiduMap";
import type { GeoPoint } from "../../../types/mapWorkbench";
import { bd09ToGcj02 } from "../../../utils/map-workbench/coordinate";
import styles from "./AdminLocationPickerModal.module.css";

type PickedLocation = {
  address: string;
  position: GeoPoint;
};

type AdminLocationPickerModalProps = {
  fallbackPosition: GeoPoint;
  initialAddress?: string;
  initialPosition?: GeoPoint;
  open: boolean;
  onCancel: () => void;
  onConfirm: (location: PickedLocation) => void;
};

/**
 * 管理端地图选点弹窗，地图点击结果会转回项目统一使用的 GCJ-02 坐标。
 */
export function AdminLocationPickerModal({
  fallbackPosition,
  initialAddress,
  initialPosition,
  open,
  onCancel,
  onConfirm,
}: AdminLocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<BMapGLMap | null>(null);
  const markerRef = useRef<BMapGLMarker | null>(null);
  const geocodeSequenceRef = useRef(0);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(
    initialPosition
      ? { address: initialAddress || "已选位置", position: initialPosition }
      : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressResolving, setIsAddressResolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fallbackLng = fallbackPosition.lng;
  const fallbackLat = fallbackPosition.lat;
  const initialLng = initialPosition?.lng;
  const initialLat = initialPosition?.lat;

  useEffect(() => {
    if (!open || !mapContainerRef.current) {
      return;
    }

    let disposed = false;
    let removeClickListener: (() => void) | undefined;
    setIsLoading(true);
    setErrorMessage("");

    loadBaiduMapGL()
      .then((BMapGL) => {
        if (disposed || !mapContainerRef.current) {
          return;
        }
        const map = new BMapGL.Map(mapContainerRef.current);
        const initialCenter =
          initialLng !== undefined && initialLat !== undefined
            ? { lng: initialLng, lat: initialLat }
            : { lng: fallbackLng, lat: fallbackLat };
        map.centerAndZoom(createBaiduPoint(initialCenter), 16);
        map.enableScrollWheelZoom(true);
        map.addControl(new BMapGL.NavigationControl());
        map.addControl(new BMapGL.ScaleControl());
        mapRef.current = map;

        if (initialLng !== undefined && initialLat !== undefined) {
          const marker = new BMapGL.Marker(
            createBaiduPoint({ lng: initialLng, lat: initialLat }),
          );
          map.addOverlay(marker);
          markerRef.current = marker;
        }

        /**
         * 点击地图后更新 Marker，并用百度逆地理编码自动生成可编辑地址。
         */
        const handleMapClick = (event: BMapGLMapClickEvent) => {
          const baiduPoint = event.latlng ?? event.point;
          if (!baiduPoint) {
            return;
          }
          if (markerRef.current) {
            map.removeOverlay(markerRef.current);
          }
          const marker = new BMapGL.Marker(baiduPoint);
          map.addOverlay(marker);
          markerRef.current = marker;
          map.panTo(baiduPoint);

          const position = roundPoint(
            bd09ToGcj02({ lng: baiduPoint.lng, lat: baiduPoint.lat }),
          );
          const currentSequence = geocodeSequenceRef.current + 1;
          geocodeSequenceRef.current = currentSequence;
          setIsAddressResolving(true);
          setPickedLocation({
            address: "正在解析地址…",
            position,
          });
          const geocoder = new BMapGL.Geocoder();
          geocoder.getLocation(baiduPoint, (result) => {
            // 连续点击时仅接受最后一次逆地理编码，避免旧请求覆盖新点位。
            if (disposed || currentSequence !== geocodeSequenceRef.current) {
              return;
            }
            setPickedLocation({
              address: result?.address || "地图选取位置",
              position,
            });
            setIsAddressResolving(false);
          });
        };

        map.addEventListener("click", handleMapClick);
        removeClickListener = () =>
          map.removeEventListener("click", handleMapClick);
      })
      .catch((error) => {
        if (!disposed) {
          setErrorMessage(
            error instanceof Error ? error.message : "地图加载失败",
          );
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false);
        }
      });

    return () => {
      disposed = true;
      geocodeSequenceRef.current += 1;
      removeClickListener?.();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [fallbackLat, fallbackLng, initialLat, initialLng, open]);

  return (
    <Modal
      title="在地图上确认景点位置"
      open={open}
      width={760}
      destroyOnHidden
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<AimOutlined />}
          loading={isAddressResolving}
          disabled={!pickedLocation || isAddressResolving}
          onClick={() => {
            if (pickedLocation) {
              onConfirm(pickedLocation);
            }
          }}
        >
          使用此位置
        </Button>,
      ]}
    >
      <div className={styles.pickerShell}>
        <div className={styles.guideStrip}>
          <EnvironmentOutlined />
          <span>点击地图中的准确位置，系统会自动解析地址和经纬度。</span>
        </div>
        <div className={styles.mapFrame}>
          <div ref={mapContainerRef} className={styles.mapCanvas} />
          {isLoading ? (
            <div className={styles.mapState}>
              <Spin />
              <span>正在加载地图</span>
            </div>
          ) : null}
        </div>
        {errorMessage ? (
          <Alert type="error" showIcon message={errorMessage} />
        ) : pickedLocation ? (
          <div className={styles.locationSummary}>
            <span className={styles.summaryIcon}>
              <EnvironmentOutlined />
            </span>
            <div>
              <strong>{pickedLocation.address}</strong>
              <small>
                GCJ-02：{pickedLocation.position.lng.toFixed(6)},{" "}
                {pickedLocation.position.lat.toFixed(6)}
              </small>
            </div>
          </div>
        ) : (
          <Alert type="info" showIcon message="请在地图上点击景点位置" />
        )}
      </div>
    </Modal>
  );
}

/**
 * 数据库存储六位小数，选点时提前统一精度，避免表单展示和提交结果不一致。
 */
function roundPoint(point: GeoPoint): GeoPoint {
  return {
    lng: Number(point.lng.toFixed(6)),
    lat: Number(point.lat.toFixed(6)),
  };
}
