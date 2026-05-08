import {
  AimOutlined,
  AppstoreAddOutlined,
  CarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FlagOutlined,
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
} from "antd";
import type { ReactNode } from "react";
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
  planResult?: RoutePlanResponseDto;
  planError?: string;
  onStartPointChange: (value: string) => void;
  onSelectStartPoint: (value: string, position?: GeoPoint) => void;
  onUseCurrentLocation: () => void;
  onTransportChange: (value: TransportType) => void;
  onPlanModeChange: (value: PlanMode) => void;
  onPlanRoute: () => void;
  onRemoveSpot: (spotId: number) => void;
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
  planResult,
  planError,
  onStartPointChange,
  onSelectStartPoint,
  onUseCurrentLocation,
  onTransportChange,
  onPlanModeChange,
  onPlanRoute,
  onRemoveSpot,
  onClearTrip,
}: TripPlannerDockProps) {
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
          <div className={styles.tripPopoverItem} key={spot.id}>
            <span className={styles.tripIndex}>{index + 1}</span>
            <strong>{spot.name}</strong>
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
    <section className={styles.tripDock} aria-label="行程规划区域">
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
        <label className={`${styles.railCard} ${styles.startCard}`}>
          <span>起点</span>
          <AutoComplete
            className={styles.startAutocomplete}
            filterOption={false}
            value={startPoint}
            options={startPointOptions}
            onSearch={onStartPointChange}
            onChange={onStartPointChange}
            onSelect={(value, option) => onSelectStartPoint(value, (option as StartPointOption).position)}
          >
            <Input
              prefix={
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
              suffix={<EnvironmentOutlined className={styles.startPointIcon} />}
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
          <span>规划模式</span>
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
          {planResult ? "重新规划路线" : "开始规划路线"}
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
