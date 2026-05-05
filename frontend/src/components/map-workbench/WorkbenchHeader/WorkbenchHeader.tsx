import { Button, Input, Segmented, Select } from "antd";
import type {
  SpotTag,
  SpotTagCode,
  TravelCity,
} from "../../../types/mapWorkbench";
import styles from "./WorkbenchHeader.module.css";

export type ActiveSpotFilter = "all" | SpotTagCode;

interface WorkbenchHeaderProps {
  cities: TravelCity[];
  selectedCityId?: number;
  cityName: string;
  tags: SpotTag[];
  searchKeyword: string;
  activeFilter: ActiveSpotFilter;
  onCityChange: (cityId: number) => void;
  onSearchKeywordChange: (keyword: string) => void;
  onActiveFilterChange: (filter: ActiveSpotFilter) => void;
}

const quickActions = ["我的位置", "路线规划", "收藏夹"];

// WorkbenchHeader 负责顶部品牌、搜索、城市和分类筛选区域。
export function WorkbenchHeader({
  cities,
  selectedCityId,
  cityName,
  tags,
  searchKeyword,
  activeFilter,
  onCityChange,
  onSearchKeywordChange,
  onActiveFilterChange,
}: WorkbenchHeaderProps) {
  const filterOptions = [
    { label: "全部", value: "all" },
    ...tags.map((tag) => ({ label: tag.name, value: tag.code })),
  ];
  const cityOptions = cities.map((city) => ({
    label: `${city.name} · ${city.provinceName}`,
    value: city.id,
  }));

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarMain}>
        <div className={styles.brandArea}>
          <div className={styles.logoMark} aria-hidden="true">
            行
          </div>
          <div>
            <p className={styles.brandName}>行迹旅图 TrailMap</p>
            <p className={styles.brandMeta}>全国一站式旅游规划</p>
          </div>
        </div>

        <Input
          className={styles.searchBox}
          aria-label="搜索城市、景点或美食"
          value={searchKeyword}
          prefix="⌕"
          placeholder="搜索城市 / 景点 / 美食"
          allowClear
          onChange={(event) => onSearchKeywordChange(event.target.value)}
        />

        <Select
          className={styles.citySelect}
          aria-label="切换当前城市"
          value={selectedCityId}
          options={cityOptions}
          placeholder={cityName}
          onChange={onCityChange}
        />

        <div className={styles.actionGroup} aria-label="快捷操作">
          {quickActions.map((action) => (
            <Button className={styles.actionButton} key={action}>
              {action}
            </Button>
          ))}
        </div>
      </div>

      <nav className={styles.filterRail} aria-label="景点分类筛选">
        <Segmented
          className={styles.filterSegmented}
          value={activeFilter}
          options={filterOptions}
          onChange={(value) => onActiveFilterChange(value as ActiveSpotFilter)}
        />
      </nav>
    </header>
  );
}
