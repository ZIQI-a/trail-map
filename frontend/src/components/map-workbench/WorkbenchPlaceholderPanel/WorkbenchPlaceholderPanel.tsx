import styles from './WorkbenchPlaceholderPanel.module.css';

interface WorkbenchPlaceholderPanelProps {
  label: string;
  title: string;
  description: string;
}

// WorkbenchPlaceholderPanel 是阶段 2 中未开发区域的临时占位组件。
export function WorkbenchPlaceholderPanel({ label, title, description }: WorkbenchPlaceholderPanelProps) {
  return (
    <aside className={styles.sidePanel}>
      <p className={styles.panelLabel}>{label}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </aside>
  );
}
