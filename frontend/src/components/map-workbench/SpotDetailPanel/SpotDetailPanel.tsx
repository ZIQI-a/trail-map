import type { SpotTag, TravelSpot } from '../../../types/mapWorkbench';
import { formatDuration, getSpotTagName } from '../../../utils/map-workbench/spotDisplay';
import styles from './SpotDetailPanel.module.css';

interface SpotDetailPanelProps {
  spot?: TravelSpot;
  tags: SpotTag[];
  nearbySpots: TravelSpot[];
  isInTrip: boolean;
  onAddToTrip: (spotId: number) => void;
  onSelectSpot: (spotId: number) => void;
}

// SpotDetailPanel 负责右侧选中景点详情和加入行程入口。
export function SpotDetailPanel({
  spot,
  tags,
  nearbySpots,
  isInTrip,
  onAddToTrip,
  onSelectSpot,
}: SpotDetailPanelProps) {
  if (!spot) {
    return (
      <aside className={styles.panel}>
        <p className={styles.panelLabel}>景点详情</p>
        <div className={styles.emptyState}>请选择一个景点查看详情。</div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel} aria-label="景点详情">
      <div className={styles.coverBlock}>
        <span className={styles.coverType}>{spot.ticketInfo}</span>
        <strong>{spot.name}</strong>
        <span>{spot.address}</span>
      </div>

      <div className={styles.titleBlock}>
        <p className={styles.panelLabel}>景点详情</p>
        <h2>{spot.name}</h2>
        <p>{spot.summary}</p>
      </div>

      <div className={styles.scoreRow}>
        <div>
          <strong>{spot.recommendScore.toFixed(1)}</strong>
          <span>推荐评分</span>
        </div>
        <div>
          <strong>{formatDuration(spot.suggestedDurationMinutes)}</strong>
          <span>建议游玩</span>
        </div>
      </div>

      <div className={styles.tagLine}>
        {spot.tags.map((tagCode) => (
          <span className={styles.tagPill} key={tagCode}>
            {getSpotTagName(tagCode, tags)}
          </span>
        ))}
      </div>

      <dl className={styles.infoList}>
        <div>
          <dt>开放时间</dt>
          <dd>{spot.openingHours}</dd>
        </div>
        <div>
          <dt>门票信息</dt>
          <dd>{spot.ticketInfo}</dd>
        </div>
        <div>
          <dt>推荐时段</dt>
          <dd>{spot.bestTime}</dd>
        </div>
      </dl>

      <div className={styles.reasonBlock}>
        <span>推荐理由</span>
        <p>{spot.recommendReason}</p>
      </div>

      <div className={styles.actionRow}>
        <button className={styles.primaryButton} type="button" disabled={isInTrip} onClick={() => onAddToTrip(spot.id)}>
          {isInTrip ? '已加入行程' : '加入行程'}
        </button>
        <button className={styles.secondaryButton} type="button">
          导航到这里
        </button>
      </div>

      <section className={styles.nearbyBlock} aria-label="附近景点">
        <div className={styles.nearbyTitle}>
          <span>附近景点</span>
          <small>{nearbySpots.length} 个可串联</small>
        </div>
        <div className={styles.nearbyList}>
          {nearbySpots.map((nearbySpot) => (
            <button className={styles.nearbyItem} type="button" key={nearbySpot.id} onClick={() => onSelectSpot(nearbySpot.id)}>
              <strong>{nearbySpot.name}</strong>
              <span>{nearbySpot.distanceText}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
