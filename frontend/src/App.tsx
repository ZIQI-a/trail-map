import styles from './App.module.css';

// App 是第一阶段的最小页面，用于验证 Vite + React 项目可以正常运行。
function App() {
  return (
    <main className={styles.pageShell}>
      <section className={styles.introPanel}>
        <p className={styles.eyebrow}>TrailMap Phase 1</p>
        <h1>行迹地图项目骨架已初始化</h1>
        <p className={styles.description}>
          当前阶段只保留最小可运行页面。下一阶段会按照原型图搭建地图工作台静态页面，并先使用 Mock 地图容器。
        </p>
      </section>
    </main>
  );
}

export default App;
