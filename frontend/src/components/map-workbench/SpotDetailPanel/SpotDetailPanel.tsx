import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  HeartFilled,
  HeartOutlined,
  PlusOutlined,
  StarFilled,
  TagsOutlined,
} from '@ant-design/icons';
import { Empty, Tag } from 'antd';
import type { SpotTag, TravelSpot } from '../../../types/mapWorkbench';
import { formatDuration, getSpotTagName } from '../../../utils/map-workbench/spotDisplay';
import styles from './SpotDetailPanel.module.css';

interface SpotDetailPanelProps {
  favoriteLoading: boolean;
  checkinLoading: boolean;
  isCheckedIn: boolean;
  isFavorite: boolean;
  isLoggedIn: boolean;
  spot?: TravelSpot;
  tags: SpotTag[];
  nearbySpots: TravelSpot[];
  isInTrip: boolean;
  onAddToTrip: (spotId: number) => void;
  onToggleCheckin: (spotId: number) => void;
  onToggleFavorite: (spotId: number) => void;
  onSelectSpot: (spotId: number) => void;
}

// SpotDetailPanel 负责右侧选中景点详情和加入行程入口。
export function SpotDetailPanel({
  favoriteLoading,
  checkinLoading,
  isCheckedIn,
  isFavorite,
  isLoggedIn,
  spot,
  tags,
  nearbySpots,
  isInTrip,
  onAddToTrip,
  onToggleCheckin,
  onToggleFavorite,
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
      <div
        className={styles.coverBlock}
        style={spot.coverUrl ? { backgroundImage: `linear-gradient(180deg, rgb(13 30 56 / 4%), rgb(13 30 56 / 62%)), url(${spot.coverUrl})` } : undefined}
      >
        <div className={styles.coverActions}>
          <button
            className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteButtonActive : ''}`}
            type="button"
            aria-label={isLoggedIn ? (isFavorite ? '取消收藏景点' : '收藏景点') : '登录后收藏景点'}
            aria-pressed={isFavorite}
            disabled={favoriteLoading}
            onClick={() => onToggleFavorite(spot.id)}
          >
            {isFavorite ? <HeartFilled /> : <HeartOutlined />}
          </button>
          <button
            className={`${styles.favoriteButton} ${isCheckedIn ? styles.checkinButtonActive : ''}`}
            type="button"
            aria-label={isLoggedIn ? (isCheckedIn ? '取消景点打卡' : '打卡景点') : '登录后打卡景点'}
            aria-pressed={isCheckedIn}
            disabled={checkinLoading}
            onClick={() => onToggleCheckin(spot.id)}
          >
            {isCheckedIn ? <CheckCircleFilled /> : <CheckCircleOutlined />}
          </button>
        </div>
      </div>

      <div className={styles.titleBlock}>
        <h2>{spot.name}</h2>
        <div className={styles.ratingRow}>
          <span className={styles.ratingScore}>{spot.recommendScore.toFixed(1)}</span>
          <span className={styles.stars} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarFilled key={index} />
            ))}
          </span>
          <span>{spot.distanceText}</span>
        </div>
      </div>

      <div className={styles.tagLine}>
        {spot.tags.map((tagCode) => (
          <Tag className={styles.tagPill} bordered={false} key={tagCode}>
            {getSpotTagName(tagCode, tags)}
          </Tag>
        ))}
      </div>

      <p className={styles.summaryText}>{spot.summary}</p>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <ClockCircleOutlined />
          <span>开放时间</span>
          <strong>{spot.openingHours}</strong>
        </div>
        <div className={styles.infoItem}>
          <TagsOutlined />
          <span>门票价格</span>
          <strong>{spot.ticketInfo}</strong>
        </div>
        <div className={styles.infoItem}>
          <CompassOutlined />
          <span>建议游玩</span>
          <strong>{formatDuration(spot.suggestedDurationMinutes)}</strong>
        </div>
        <div className={styles.infoItem}>
          <EnvironmentOutlined />
          <span>推荐时段</span>
          <strong>{spot.bestTime}</strong>
        </div>
      </div>

      <div className={styles.reasonBlock}>
        <span>推荐理由</span>
        <p>{spot.recommendReason}</p>
      </div>

      <div className={styles.actionRow}>
        <button className={styles.secondaryButton} type="button" disabled={isInTrip} onClick={() => onAddToTrip(spot.id)}>
          <PlusOutlined />
          {isInTrip ? '已加入行程' : '加入行程'}
        </button>
        <button
          className={styles.primaryButton}
          type="button"
          aria-label={isLoggedIn ? (isCheckedIn ? '取消景点打卡' : '打卡景点') : '登录后打卡景点'}
          aria-pressed={isCheckedIn}
          disabled={checkinLoading}
          onClick={() => onToggleCheckin(spot.id)}
        >
          {isCheckedIn ? <CheckCircleFilled /> : <CheckCircleOutlined />}
          {isCheckedIn ? '已打卡' : '去打卡'}
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
              <span
                className={styles.nearbyThumb}
                style={nearbySpot.coverUrl ? { backgroundImage: `url(${nearbySpot.coverUrl})` } : undefined}
                aria-hidden="true"
              />
              <span className={styles.nearbyText}>
                <strong>{nearbySpot.name}</strong>
                <span>{nearbySpot.distanceText}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
