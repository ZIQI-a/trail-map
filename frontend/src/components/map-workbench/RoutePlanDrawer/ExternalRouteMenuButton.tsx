import { ExportOutlined } from "@ant-design/icons";
import { Dropdown, Tooltip, type MenuProps } from "antd";
import type { RouteSegmentDto } from "../../../types/mapWorkbench";
import {
  buildExternalRouteUrl,
  supportsExternalRoute,
  type ExternalMapProvider,
} from "../../../utils/map-workbench/externalRoute";
import styles from "./ExternalRouteMenuButton.module.css";

interface ExternalRouteMenuButtonProps {
  cityName: string;
  segment: RouteSegmentDto;
  onError: (errorMessage: string) => void;
}

/** 地图平台官网图标；加载失败时由组件保留品牌首字作为托底。 */
const MAP_PROVIDER_LOGOS: Record<ExternalMapProvider, string> = {
  baidu: "https://map.baidu.com/favicon.ico",
  amap: "https://ditu.amap.com/favicon.ico",
};

/**
 * 路线分段的外部地图入口，允许用户选择百度或高德查看实时详细路线。
 */
export function ExternalRouteMenuButton({
  cityName,
  segment,
  onError,
}: ExternalRouteMenuButtonProps) {
  const baiduSupported = supportsExternalRoute(
    "baidu",
    segment.transportType,
  );
  const menuItems: MenuProps["items"] = [
    {
      key: "baidu",
      disabled: !baiduSupported,
      label: (
        <MapProviderOption
          mark="百"
          provider="baidu"
          title="百度地图"
          description={
            baiduSupported ? "查看实时路线详情" : "网页端暂不支持骑行路线"
          }
        />
      ),
    },
    {
      key: "amap",
      label: (
        <MapProviderOption
          mark="高"
          provider="amap"
          title="高德地图"
          description={
            segment.transportType === "bicycling"
              ? "骑行路线建议在手机端查看"
              : "查看实时路线详情"
          }
        />
      ),
    },
  ];

  /**
   * 用户选择地图服务后同步打开新标签页，避免被浏览器判定为异步弹窗。
   */
  function handleProviderSelect({ key }: { key: string }) {
    const provider = key as ExternalMapProvider;
    try {
      const routeUrl = buildExternalRouteUrl(provider, segment, cityName);
      window.open(routeUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "外部地图链接生成失败",
      );
    }
  }

  return (
    <Tooltip title="在地图网站查看详细路线" placement="top">
      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleProviderSelect,
        }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <button
          className={styles.routeButton}
          type="button"
          aria-label={`查看${segment.fromName}到${segment.toName}的详细路线`}
          onClick={(event) => event.stopPropagation()}
        >
          <ExportOutlined />
        </button>
      </Dropdown>
    </Tooltip>
  );
}

interface MapProviderOptionProps {
  mark: string;
  provider: ExternalMapProvider;
  title: string;
  description: string;
}

/**
 * 地图服务菜单项，优先展示平台官网图标，网络图片不可用时回退到品牌首字。
 */
function MapProviderOption({
  mark,
  provider,
  title,
  description,
}: MapProviderOptionProps) {
  return (
    <span className={styles.providerOption}>
      <span
        className={`${styles.providerMark} ${styles[provider]}`}
        aria-hidden="true"
      >
        <span className={styles.providerFallback}>{mark}</span>
        <img
          className={styles.providerLogo}
          src={MAP_PROVIDER_LOGOS[provider]}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      </span>
      <span className={styles.providerText}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </span>
  );
}
