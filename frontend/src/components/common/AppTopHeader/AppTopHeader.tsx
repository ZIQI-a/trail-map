import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./AppTopHeader.module.css";

interface AppTopHeaderProps {
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
}

// AppTopHeader 只承接全站通用顶部第一行：左侧品牌固定，中间和右侧由不同页面注入。
export function AppTopHeader({ centerSlot, rightSlot }: AppTopHeaderProps) {
  return (
    <div className={styles.topHeader}>
      <Link className={styles.brandArea} to="/" aria-label="返回行迹旅图首页">
        <img
          className={styles.brandLogo}
          src="/header_logo.png"
          alt="行迹旅图 TrailMap"
        />
      </Link>

      <div className={styles.centerSlot}>{centerSlot}</div>
      <div className={styles.rightSlot}>{rightSlot}</div>
    </div>
  );
}
