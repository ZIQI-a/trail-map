import { Button, Descriptions, Empty, Tag } from 'antd';
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
        <Empty className={styles.emptyState} image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个景点查看详情" />
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
          <Tag className={styles.tagPill} bordered={false} key={tagCode}>
            {getSpotTagName(tagCode, tags)}
          </Tag>
        ))}
      </div>

      <Descriptions
        className={styles.infoList}
        column={1}
        size="small"
        bordered
        items={[
          { key: 'openingHours', label: '开放时间', children: spot.openingHours },
          { key: 'ticketInfo', label: '门票信息', children: spot.ticketInfo },
          { key: 'bestTime', label: '推荐时段', children: spot.bestTime },
        ]}
      />

      <div className={styles.reasonBlock}>
        <span>推荐理由</span>
        <p>{spot.recommendReason}</p>
      </div>

      <div className={styles.actionRow}>
        <Button className={styles.primaryButton} type="primary" disabled={isInTrip} onClick={() => onAddToTrip(spot.id)}>
          {isInTrip ? '已加入行程' : '加入行程'}
        </Button>
        <Button className={styles.secondaryButton}>导航到这里</Button>
      </div>

      <section className={styles.nearbyBlock} aria-label="附近景点">
        <div className={styles.nearbyTitle}>
          <span>附近景点</span>
          <small>{nearbySpots.length} 个可串联</small>
        </div>
        <div className={styles.nearbyList}>
          {nearbySpots.map((nearbySpot) => (
            <Button className={styles.nearbyItem} type="text" block key={nearbySpot.id} onClick={() => onSelectSpot(nearbySpot.id)}>
              <strong>{nearbySpot.name}</strong>
              <span>{nearbySpot.distanceText}</span>
            </Button>
          ))}
        </div>
      </section>
    </aside>
  );
}
