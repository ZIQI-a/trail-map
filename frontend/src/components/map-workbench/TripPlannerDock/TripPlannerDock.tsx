import {
  AimOutlined,
  AppstoreAddOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CarOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  HolderOutlined,
  QuestionCircleOutlined,
  PushpinOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Alert,
  Badge,
  Button,
  Empty,
  Input,
  Popover,
  Segmented,
  Select,
  Tooltip,
} from "antd";
import { useState, type DragEvent, type ReactNode } from "react";
import type {
  GeoPoint,
  PlanMode,
  RoutePlanResponseDto,
  TransportType,
  TravelSpot,
} from "../../../types/mapWorkbench";
import {
  formatRouteDistance,
  formatRouteDuration,
  formatTripDuration,
} from "../../../utils/map-workbench/routeDisplay";
import styles from "./TripPlannerDock.module.css";

interface PlannerOption<T extends string> {
  label: string;
  value: T;
}

interface StartPointOption {
  label: ReactNode;
  value: string;
  position?: GeoPoint;
}

interface TripPlannerDockProps {
  tripSpots: TravelSpot[];
  transportTypes: Array<PlannerOption<TransportType>>;
  planModes: Array<PlannerOption<PlanMode>>;
  startPoint: string;
  startPointOptions: StartPointOption[];
  selectedTransport: TransportType;
  selectedPlanMode: PlanMode;
  planning: boolean;
  locatingCurrentPosition: boolean;
  dragOverTrip: boolean;
  startPointPicking: boolean;
  planResult?: RoutePlanResponseDto;
  planError?: string;
  onStartPointChange: (value: string) => void;
  onStartPointFocus: () => void;
  onSelectStartPoint: (value: string, position?: GeoPoint) => void;
  onUseCurrentLocation: () => void;
  onTransportChange: (value: TransportType) => void;
  onPlanModeChange: (value: PlanMode) => void;
  onPlanRoute: () => void;
  onRemoveSpot: (spotId: number) => void;
  onReorderSpot: (fromIndex: number, toIndex: number) => void;
  onDropRecommendSpot: (event: DragEvent<HTMLElement>) => void;
  onTripDragOver: (event: DragEvent<HTMLElement>) => void;
  onTripDragLeave: () => void;
  onClearTrip: () => void;
}

// TripPlannerDock 负责底部一行式行程规划工具条和景点池弹层。
export function TripPlannerDock({
  tripSpots,
  transportTypes,
  planModes,
  startPoint,
  startPointOptions,
  selectedTransport,
  selectedPlanMode,
  planning,
  locatingCurrentPosition,
  dragOverTrip,
  startPointPicking,
  planResult,
  planError,
  onStartPointChange,
  onStartPointFocus,
  onSelectStartPoint,
  onUseCurrentLocation,
  onTransportChange,
  onPlanModeChange,
  onPlanRoute,
  onRemoveSpot,
  onReorderSpot,
  onDropRecommendSpot,
  onTripDragOver,
  onTripDragLeave,
  onClearTrip,
}: TripPlannerDockProps) {
  const [draggingSpotId, setDraggingSpotId] = useState<number>();
  const [dragOverSpotId, setDragOverSpotId] = useState<number>();
  const isScheduleMode = selectedPlanMode === "schedule";
  const totalDistanceText = planResult
    ? formatRouteDistance(planResult.totalDistanceMeters)
    : "--";
  const totalTravelText = planResult
    ? formatRouteDuration(planResult.totalTravelDurationSeconds)
    : "--";
  const totalTripText = planResult
    ? formatTripDuration(planResult.totalTripDurationMinutes)
    : "--";
  // 行程池通过 Popover 展开，避免长期占用地图视野。
  // 行程池拖拽只调整前端景点顺序，真正路线顺序会在下一次规划时按该顺序提交给后端。
  const handleDragStart = (event: DragEvent<HTMLDivElement>, spotId: number) => {
    setDraggingSpotId(spotId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(spotId));
  };

  const handleDrop = (targetSpotId: number) => {
    if (!draggingSpotId || draggingSpotId === targetSpotId) {
      setDraggingSpotId(undefined);
      setDragOverSpotId(undefined);
      return;
    }

    const fromIndex = tripSpots.findIndex((spot) => spot.id === draggingSpotId);
    const toIndex = tripSpots.findIndex((spot) => spot.id === targetSpotId);
    if (fromIndex >= 0 && toIndex >= 0) {
      onReorderSpot(fromIndex, toIndex);
    }
    setDraggingSpotId(undefined);
    setDragOverSpotId(undefined);
  };

  const tripPopoverContent =
    tripSpots.length === 0 ? (
      <Empty
        className={styles.popoverEmpty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="先从右侧详情把景点加入行程"
      />
    ) : (
      <div className={styles.tripPopoverList}>
        {tripSpots.map((spot, index) => (
          <div
            className={[
              styles.tripPopoverItem,
              draggingSpotId === spot.id ? styles.draggingItem : "",
              dragOverSpotId === spot.id && draggingSpotId !== spot.id ? styles.dragOverItem : "",
            ].filter(Boolean).join(" ")}
            key={spot.id}
            draggable
            onDragStart={(event) => handleDragStart(event, spot.id)}
            onDragEnd={() => {
              setDraggingSpotId(undefined);
              setDragOverSpotId(undefined);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverSpotId(spot.id);
            }}
            onDrop={() => handleDrop(spot.id)}
          >
            <span className={styles.dragHandle} aria-hidden="true">
              <HolderOutlined />
            </span>
            <span className={styles.tripIndex}>{index + 1}</span>
            <strong>{spot.name}</strong>
            <div className={styles.sortButtons} aria-label={`${spot.name}排序操作`}>
              <button
                className={styles.sortButton}
                type="button"
                aria-label={`${spot.name}上移`}
                disabled={index === 0}
                onClick={() => onReorderSpot(index, index - 1)}
              >
                <ArrowUpOutlined />
              </button>
              <button
                className={styles.sortButton}
                type="button"
                aria-label={`${spot.name}下移`}
                disabled={index === tripSpots.length - 1}
                onClick={() => onReorderSpot(index, index + 1)}
              >
                <ArrowDownOutlined />
              </button>
            </div>
            <button
              className={styles.removeButton}
              type="button"
              aria-label={`删除${spot.name}`}
              onClick={() => onRemoveSpot(spot.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );

  return (
    <section
      className={`${styles.tripDock} ${dragOverTrip ? styles.tripDockDropActive : ""}`}
      aria-label="行程规划区域"
      onDragOver={onTripDragOver}
      onDragLeave={onTripDragLeave}
      onDrop={onDropRecommendSpot}
    >
      <div className={styles.tripCluster}>
        <Popover
          placement="topLeft"
          trigger="click"
          content={tripPopoverContent}
          overlayClassName={styles.tripPopover}
        >
          <button className={styles.tripLauncher} type="button">
            <span className={styles.tripLauncherIcon}>
              <UnorderedListOutlined />
            </span>
            <div className={styles.tripLauncherText}>
              <strong>我的行程</strong>
              <span>
                {tripSpots.length === 0
                  ? "还没有加入景点"
                  : `已选 ${tripSpots.length} 个景点`}
              </span>
            </div>
            <Badge count={tripSpots.length} size="small" />
          </button>
        </Popover>
        <Button
          className={styles.clearButton}
          size="small"
          disabled={tripSpots.length === 0}
          onClick={onClearTrip}
        >
          清空
        </Button>
      </div>

      <div className={styles.plannerRail}>
        <label className={`${styles.railCard} ${styles.startCard} ${startPointPicking ? styles.startCardPicking : ""}`}>
          <span>{startPointPicking ? "点击地图选点中" : "起点"}</span>
          <AutoComplete
            className={styles.startAutocomplete}
            filterOption={false}
            value={startPoint}
            options={startPointOptions}
            onSearch={onStartPointChange}
            onChange={onStartPointChange}
            onFocus={onStartPointFocus}
            onSelect={(value, option) => onSelectStartPoint(value, (option as StartPointOption).position)}
          >
            <Input
              prefix={<PushpinOutlined className={styles.startDecorIcon} />}
              suffix={
                <button
                  className={styles.locateButton}
                  type="button"
                  title="使用当前位置"
                  aria-label="使用当前位置"
                  onClick={onUseCurrentLocation}
                >
                  <AimOutlined />
                </button>
              }
              placeholder="例如：春熙路地铁站"
              disabled={locatingCurrentPosition}
            />
          </AutoComplete>
        </label>

        <label className={styles.railCard}>
          <span>交通方式</span>
          <Select
            value={selectedTransport}
            options={transportTypes}
            onChange={(value) => onTransportChange(value as TransportType)}
          />
        </label>

        <label className={styles.railCard}>
          <span className={styles.labelWithHelp}>
            规划模式
            <Tooltip
              placement="top"
              overlayClassName={styles.planModeTooltip}
              title={
                <div className={styles.planModeHelp}>
                  <strong>自由路线</strong>
                  <p>按行程池中的景点顺序生成路线，重点查看每段交通距离、耗时和整体路线走向，适合先粗排景点。</p>
                  <strong>完整行程</strong>
                  <p>在路线基础上加入游玩天数、开始结束时间、行程强度、午餐/休息/酒店等设置，生成按天展示的时间轴。</p>
                </div>
              }
            >
              <QuestionCircleOutlined className={styles.helpIcon} />
            </Tooltip>
          </span>
          <Segmented
            className={styles.modeSegmented}
            value={selectedPlanMode}
            options={planModes}
            onChange={(value) => onPlanModeChange(value as PlanMode)}
          />
        </label>

        <div className={styles.metricStrip} aria-label="路线规划摘要">
          <div className={styles.summaryMetric}>
            <AppstoreAddOutlined />
            <span>景点数</span>
            <strong>{tripSpots.length} 个</strong>
          </div>
          <div className={styles.summaryMetric}>
            <FlagOutlined />
            <span>总里程</span>
            <strong>{totalDistanceText}</strong>
          </div>
          <div className={styles.summaryMetric}>
            <CarOutlined />
            <span>交通耗时</span>
            <strong>{totalTravelText}</strong>
          </div>
          <div className={styles.summaryMetric}>
            <ClockCircleOutlined />
            <span>预计总时长</span>
            <strong>{totalTripText}</strong>
          </div>
        </div>

        <Button
          className={styles.planButton}
          type="primary"
          disabled={tripSpots.length === 0}
          loading={planning}
          onClick={onPlanRoute}
        >
          {planResult
            ? isScheduleMode
              ? "重新生成行程"
              : "重新规划路线"
            : isScheduleMode
              ? "配置完整行程"
              : "开始规划路线"}
          <RightOutlined />
        </Button>
      </div>

      {planError ? (
        <div className={styles.feedbackRow}>
          <Alert
            type="error"
            showIcon
            message="行程规划失败"
            description={planError}
          />
        </div>
      ) : null}
    </section>
  );
}
