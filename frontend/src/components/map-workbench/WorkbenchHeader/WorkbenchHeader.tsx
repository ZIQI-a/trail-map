import {
  AimOutlined,
  BankOutlined,
  CameraOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  HomeOutlined,
  PictureOutlined,
  SearchOutlined,
  SmileOutlined,
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Input, Segmented, Select } from "antd";
import type { ReactNode } from "react";
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

const quickActions = [
  { label: "我的位置", icon: <EnvironmentOutlined /> },
  { label: "路线规划", icon: <CompassOutlined /> },
  { label: "收藏夹", icon: <HeartOutlined /> },
];

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
    { label: buildFilterLabel("全部", <AimOutlined />), value: "all" },
    ...tags.map((tag) => ({ label: buildFilterLabel(tag.name, getFilterIcon(tag.code)), value: tag.code })),
  ];
  const cityOptions = cities.map((city) => ({
    label: `${city.name} · ${city.provinceName}`,
    value: city.id,
  }));

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarMain}>
        <div className={styles.brandArea}>
          <img className={styles.brandLogo} src="/header_logo.png" alt="行迹旅图 TrailMap" />
        </div>

        <Input
          className={styles.searchBox}
          aria-label="搜索城市、景点或美食"
          value={searchKeyword}
          prefix={<SearchOutlined />}
          placeholder="搜索城市 / 景点 / 美食"
          allowClear
          onChange={(event) => onSearchKeywordChange(event.target.value)}
        />

        <Select
          className={styles.citySelect}
          aria-label="切换当前城市"
          value={selectedCityId}
          options={cityOptions}
          suffixIcon={<EnvironmentOutlined />}
          placeholder={cityName}
          onChange={onCityChange}
        />

        <div className={styles.actionGroup} aria-label="快捷操作">
          {quickActions.map((action) => (
            <Button className={styles.actionButton} icon={action.icon} key={action.label}>
              {action.label}
            </Button>
          ))}
          <Avatar className={styles.userAvatar} size={36} icon={<SmileOutlined />} />
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

function buildFilterLabel(label: string, icon: ReactNode) {
  return (
    <span className={styles.filterLabel}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

function getFilterIcon(code: SpotTagCode) {
  switch (code) {
    case "first_visit":
      return <StarOutlined />;
    case "photo":
      return <CameraOutlined />;
    case "night_tour":
      return <ThunderboltOutlined />;
    case "family":
      return <TeamOutlined />;
    case "couple":
      return <HeartOutlined />;
    case "free":
      return <TagOutlined />;
    case "indoor":
      return <HomeOutlined />;
    case "rainy_day":
      return <PictureOutlined />;
    case "half_day":
      return <BankOutlined />;
    case "subway":
      return <EnvironmentOutlined />;
    default:
      return <AimOutlined />;
  }
}
