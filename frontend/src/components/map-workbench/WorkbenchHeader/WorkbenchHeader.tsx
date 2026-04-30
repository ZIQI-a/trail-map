import type { SpotTag, SpotTagCode } from '../../../types/mapWorkbench';
import styles from './WorkbenchHeader.module.css';

export type ActiveSpotFilter = 'all' | SpotTagCode;

interface WorkbenchHeaderProps {
  cityName: string;
  tags: SpotTag[];
  searchKeyword: string;
  activeFilter: ActiveSpotFilter;
  onSearchKeywordChange: (keyword: string) => void;
  onActiveFilterChange: (filter: ActiveSpotFilter) => void;
}

const quickActions = ['我的位置', '路线规划', '收藏夹'];

// WorkbenchHeader 负责顶部品牌、搜索、城市和分类筛选区域。
export function WorkbenchHeader({
  cityName,
  tags,
  searchKeyword,
  activeFilter,
  onSearchKeywordChange,
  onActiveFilterChange,
}: WorkbenchHeaderProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarMain}>
        <div className={styles.brandArea}>
          <div className={styles.logoMark} aria-hidden="true">
            行
          </div>
          <div>
            <p className={styles.brandName}>行迹地图 TrailMap</p>
            <p className={styles.brandMeta}>全国旅游地图工作台</p>
          </div>
        </div>

        <label className={styles.searchBox}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            aria-label="搜索城市、景点或美食"
            value={searchKeyword}
            placeholder="搜索城市 / 景点 / 美食"
            onChange={(event) => onSearchKeywordChange(event.target.value)}
          />
        </label>

        <button className={styles.cityButton} type="button" aria-label="当前城市">
          {cityName}
          <span aria-hidden="true">⌄</span>
        </button>

        <div className={styles.actionGroup} aria-label="快捷操作">
          {quickActions.map((action) => (
            <button className={styles.actionButton} type="button" key={action}>
              {action}
            </button>
          ))}
        </div>
      </div>

      <nav className={styles.filterRail} aria-label="景点分类筛选">
        <button
          className={activeFilter === 'all' ? styles.filterButtonActive : styles.filterButton}
          type="button"
          aria-pressed={activeFilter === 'all'}
          onClick={() => onActiveFilterChange('all')}
        >
          全部
        </button>
        {tags.map((tag) => (
          <button
            className={activeFilter === tag.code ? styles.filterButtonActive : styles.filterButton}
            type="button"
            aria-pressed={activeFilter === tag.code}
            key={tag.code}
            onClick={() => onActiveFilterChange(tag.code)}
          >
            {tag.name}
          </button>
        ))}
      </nav>
    </header>
  );
}
