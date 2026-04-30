import styles from './MapWorkbenchPage.module.css';

// MapWorkbenchPage 是阶段 2.1 的页面骨架，只负责划分地图工作台的主要区域。
export function MapWorkbenchPage() {
  return (
    <main className={styles.workbenchShell}>
      <header className={styles.topBar}>
        <div className={styles.brandArea}>
          <div className={styles.logoMark} aria-hidden="true">
            行
          </div>
          <div>
            <p className={styles.brandName}>行迹地图 TrailMap</p>
            <p className={styles.brandMeta}>全国旅游地图工作台</p>
          </div>
        </div>
        <div className={styles.topPlaceholder}>顶部导航与筛选区将在 2.3 开发</div>
      </header>

      <section className={styles.contentGrid} aria-label="地图工作台主体">
        <aside className={styles.sidePanel}>
          <p className={styles.panelLabel}>左侧区域</p>
          <h2>景点推荐列表占位</h2>
          <p>后续 2.5 会在这里展示城市必玩景点列表。</p>
        </aside>

        <section className={styles.mapStage}>
          <p className={styles.panelLabel}>中心区域</p>
          <h1>Mock 地图容器占位</h1>
          <p>后续 2.4 会在这里模拟地图底图和景点点位。</p>
        </section>

        <aside className={styles.sidePanel}>
          <p className={styles.panelLabel}>右侧区域</p>
          <h2>景点详情卡片占位</h2>
          <p>后续 2.6 会在这里展示选中景点的详情信息。</p>
        </aside>
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
