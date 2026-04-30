import type { SpotTag, TravelSpot } from '../../../types/mapWorkbench';
import { formatDuration, getSpotTagName } from '../../../utils/map-workbench/spotDisplay';
import styles from './SpotRecommendList.module.css';

type RecommendTab = 'recommend' | 'distance' | 'score' | 'latest';

interface SpotRecommendListProps {
  spots: TravelSpot[];
  tags: SpotTag[];
  activeTab: RecommendTab;
  selectedSpotId?: number;
  onActiveTabChange: (tab: RecommendTab) => void;
  onSelectSpot: (spotId: number) => void;
}

const recommendTabs: Array<{ label: string; value: RecommendTab }> = [
  { label: '推荐', value: 'recommend' },
  { label: '距离', value: 'distance' },
  { label: '评分', value: 'score' },
  { label: '最新', value: 'latest' },
];

// SpotRecommendList 负责左侧景点列表展示和景点选择，不直接读取 Mock 数据。
export function SpotRecommendList({
  spots,
  tags,
  activeTab,
  selectedSpotId,
  onActiveTabChange,
  onSelectSpot,
}: SpotRecommendListProps) {
  return (
    <aside className={styles.panel} aria-label="景点推荐列表">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelLabel}>成都必玩推荐</p>
          <h2>精选景点</h2>
        </div>
        <span className={styles.countBadge}>{spots.length} 个</span>
      </div>

      <div className={styles.tabGroup} aria-label="推荐列表排序">
        {recommendTabs.map((tab) => (
          <button
            className={activeTab === tab.value ? styles.tabButtonActive : styles.tabButton}
            type="button"
            key={tab.value}
            aria-pressed={activeTab === tab.value}
            onClick={() => onActiveTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.spotList}>
        {spots.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>暂无匹配景点</strong>
            <span>换个关键词或分类试试。</span>
          </div>
        ) : (
          spots.map((spot, index) => {
            const isSelected = spot.id === selectedSpotId;

            return (
              <button
                className={isSelected ? styles.spotCardActive : styles.spotCard}
                type="button"
                key={spot.id}
                aria-pressed={isSelected}
                onClick={() => onSelectSpot(spot.id)}
              >
                <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.cardMain}>
                  <span className={styles.cardTopLine}>
                    <strong>{spot.name}</strong>
                    <span>{spot.distanceText}</span>
                  </span>
                  <span className={styles.reason}>{spot.recommendReason}</span>
                  <span className={styles.metaLine}>
                    <span>评分 {spot.recommendScore.toFixed(1)}</span>
                    <span>{formatDuration(spot.suggestedDurationMinutes)}</span>
                  </span>
                  <span className={styles.tagLine}>
                    {spot.tags.slice(0, 3).map((tagCode) => (
                      <span className={styles.tagPill} key={tagCode}>
                        {getSpotTagName(tagCode, tags)}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

export type { RecommendTab };
