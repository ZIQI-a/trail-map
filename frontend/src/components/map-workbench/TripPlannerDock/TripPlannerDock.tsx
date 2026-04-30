import type { PlanMode, TransportType, TravelSpot } from '../../../types/mapWorkbench';
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
  onStartPointChange: (value: string) => void;
  onTransportChange: (value: TransportType) => void;
  onPlanModeChange: (value: PlanMode) => void;
  onRemoveSpot: (spotId: number) => void;
  onClearTrip: () => void;
}

// TripPlannerDock 负责底部行程池和路线规划静态表单，不调用真实路线接口。
export function TripPlannerDock({
  tripSpots,
  transportTypes,
  planModes,
  startPoint,
  selectedTransport,
  selectedPlanMode,
  onStartPointChange,
  onTransportChange,
  onPlanModeChange,
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
        <button className={styles.clearButton} type="button" disabled={tripSpots.length === 0} onClick={onClearTrip}>
          清空
        </button>
      </div>

      <div className={styles.tripSpots} aria-label="已加入行程的景点">
        {tripSpots.length === 0 ? (
          <span className={styles.emptyTrip}>从右侧详情点击“加入行程”，先收集想去的景点。</span>
        ) : (
          tripSpots.map((spot, index) => (
            <div className={styles.tripSpot} key={spot.id}>
              <span className={styles.tripIndex}>{index + 1}</span>
              <strong>{spot.name}</strong>
              <button type="button" aria-label={`移除${spot.name}`} onClick={() => onRemoveSpot(spot.id)}>
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className={styles.plannerForm}>
        <label className={styles.startField}>
          <span>起点</span>
          <input
            value={startPoint}
            placeholder="例如：酒店 / 当前位置"
            onChange={(event) => onStartPointChange(event.target.value)}
          />
        </label>

        <div className={styles.optionGroup} aria-label="交通方式">
          {transportTypes.map((item) => (
            <button
              className={selectedTransport === item.value ? styles.optionButtonActive : styles.optionButton}
              type="button"
              key={item.value}
              aria-pressed={selectedTransport === item.value}
              onClick={() => onTransportChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.optionGroup} aria-label="规划模式">
          {planModes.map((item) => (
            <button
              className={selectedPlanMode === item.value ? styles.optionButtonActive : styles.optionButton}
              type="button"
              key={item.value}
              aria-pressed={selectedPlanMode === item.value}
              onClick={() => onPlanModeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
