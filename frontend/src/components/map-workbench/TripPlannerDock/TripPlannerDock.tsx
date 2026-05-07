import { Alert, Button, Empty, Input, Segmented, Spin, Tag } from 'antd';
import type { PlanMode, RoutePlanResponseDto, TransportType, TravelSpot } from '../../../types/mapWorkbench';
import styles from './TripPlannerDock.module.css';

interface PlannerOption<T extends string> {
  label: string;
  value: T;
}

interface TripPlannerDockProps {
  tripSpots: TravelSpot[];
  transportTypes: Array<PlannerOption<TransportType>>;
  planModes: Array<PlannerOption<PlanMode>>;
  startPoint: string;
  selectedTransport: TransportType;
  selectedPlanMode: PlanMode;
  planning: boolean;
  planResult?: RoutePlanResponseDto;
  planError?: string;
  onStartPointChange: (value: string) => void;
  onTransportChange: (value: TransportType) => void;
  onPlanModeChange: (value: PlanMode) => void;
  onPlanRoute: () => void;
  onRemoveSpot: (spotId: number) => void;
  onClearTrip: () => void;
}

// TripPlannerDock 负责底部行程池、规划参数录入和路线结果摘要展示。
export function TripPlannerDock({
  tripSpots,
  transportTypes,
  planModes,
  startPoint,
  selectedTransport,
  selectedPlanMode,
  planning,
  planResult,
  planError,
  onStartPointChange,
  onTransportChange,
  onPlanModeChange,
  onPlanRoute,
  onRemoveSpot,
  onClearTrip,
}: TripPlannerDockProps) {
  return (
    <section className={styles.tripDock} aria-label="行程规划区域">
      <div className={styles.tripHeader}>
        <div>
          <p className={styles.panelLabel}>我的行程</p>
          <h2>路线规划池</h2>
        </div>
        <Button className={styles.clearButton} size="small" disabled={tripSpots.length === 0} onClick={onClearTrip}>
          清空
        </Button>
      </div>

      <div className={styles.tripSpots} aria-label="已加入行程的景点">
        {tripSpots.length === 0 ? (
          <Empty
            className={styles.emptyTrip}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="从右侧详情点击“加入行程”"
          />
        ) : (
          tripSpots.map((spot, index) => (
            <Tag
              className={styles.tripSpot}
              bordered={false}
              closable
              key={spot.id}
              onClose={(event) => {
                event.preventDefault();
                onRemoveSpot(spot.id);
              }}
            >
              <span className={styles.tripIndex}>{index + 1}</span>
              <strong>{spot.name}</strong>
            </Tag>
          ))
        )}
      </div>

      <div className={styles.plannerForm}>
        <label className={styles.startField}>
          <span>起点</span>
          <Input
            value={startPoint}
            placeholder="例如：酒店 / 当前位置"
            onChange={(event) => onStartPointChange(event.target.value)}
          />
        </label>

        <div className={styles.optionGroup} aria-label="交通方式">
          <Segmented
            className={styles.optionSegmented}
            value={selectedTransport}
            options={transportTypes}
            onChange={(value) => onTransportChange(value as TransportType)}
          />
        </div>

        <div className={styles.optionGroup} aria-label="规划模式">
          <Segmented
            className={styles.optionSegmented}
            value={selectedPlanMode}
            options={planModes}
            onChange={(value) => onPlanModeChange(value as PlanMode)}
          />
        </div>

        <div className={styles.planActionRow}>
          <Button type="primary" disabled={tripSpots.length === 0} loading={planning} onClick={onPlanRoute}>
            生成行程
          </Button>
          <span className={styles.planHint}>当前优先生成自由路线，完整行程后续继续扩展</span>
        </div>

        {planError ? <Alert type="error" showIcon message="行程规划失败" description={planError} /> : null}

        {planning ? (
          <div className={styles.planLoading}>
            <Spin size="small" />
            <span>正在生成路线...</span>
          </div>
        ) : null}

        {planResult ? (
          <div className={styles.planResult}>
            <p className={styles.planSummary}>{planResult.routeSummary}</p>
            <div className={styles.planMetrics}>
              <span>交通 {Math.ceil(planResult.totalTravelDurationSeconds / 60)} 分钟</span>
              <span>游玩 {planResult.totalStayDurationMinutes} 分钟</span>
              <span>总计 {planResult.totalTripDurationMinutes} 分钟</span>
            </div>

            <div className={styles.segmentList}>
              {planResult.segments.map((segment) => (
                <div className={styles.segmentCard} key={`${segment.segmentIndex}-${segment.fromName}-${segment.toName}`}>
                  <strong>
                    第 {segment.segmentIndex} 段 · {segment.fromName} → {segment.toName}
                  </strong>
                  <span>
                    {Math.ceil(segment.durationSeconds / 60)} 分钟 · {(segment.distanceMeters / 1000).toFixed(1)} 公里
                  </span>
                  <p>{segment.instruction}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
