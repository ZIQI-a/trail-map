import { useState } from 'react';
import { MockMapStage } from '../../components/map-workbench/MockMapStage';
import { WorkbenchHeader, type ActiveSpotFilter } from '../../components/map-workbench/WorkbenchHeader';
import { WorkbenchPlaceholderPanel } from '../../components/map-workbench/WorkbenchPlaceholderPanel';
import { chengduWorkbenchData } from '../../mocks/map-workbench';
import styles from './MapWorkbenchPage.module.css';

// MapWorkbenchPage 是地图工作台页面入口，只组织页面布局和跨组件共享状态。
export function MapWorkbenchPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveSpotFilter>('all');
  const [selectedSpotId, setSelectedSpotId] = useState(chengduWorkbenchData.spots[0]?.id);
  const { city, tags, spots, areas } = chengduWorkbenchData;

  return (
    <main className={styles.workbenchShell}>
      <WorkbenchHeader
        cityName={city.name}
        tags={tags}
        searchKeyword={searchKeyword}
        activeFilter={activeFilter}
        onSearchKeywordChange={setSearchKeyword}
        onActiveFilterChange={setActiveFilter}
      />

      <section className={styles.contentGrid} aria-label="地图工作台主体">
        <WorkbenchPlaceholderPanel
          label="左侧区域"
          title="景点推荐列表占位"
          description="后续 2.5 会在这里展示城市必玩景点列表。"
        />

        <MockMapStage
          cityName={city.name}
          spots={spots}
          areaNames={areas.map((area) => area.name)}
          selectedSpotId={selectedSpotId}
          onSelectSpot={setSelectedSpotId}
        />

        <WorkbenchPlaceholderPanel
          label="右侧区域"
          title="景点详情卡片占位"
          description="后续 2.6 会在这里展示选中景点的详情信息。"
        />
      </section>

      <section className={styles.tripDock} aria-label="行程规划区域">
        <div>
          <p className={styles.panelLabel}>底部区域</p>
          <h2>我的行程占位</h2>
        </div>
        <p>后续 2.7 会在这里实现行程池、起点、交通方式和规划模式。</p>
      </section>
    </main>
  );
}
