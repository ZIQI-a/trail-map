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
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import type { ReactNode } from "react";
import { AppTopHeader } from "../../common";
import type { AppUserDto } from "../../../types/auth";
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
  currentUser?: AppUserDto;
  onCityChange: (cityId: number) => void;
  onSearchKeywordChange: (keyword: string) => void;
  onActiveFilterChange: (filter: ActiveSpotFilter) => void;
  onAuthClick: () => void;
  onLocateCurrentPosition: () => void;
  onFavoritesClick: () => void;
  onTripsClick: () => void;
  onLogout: () => void;
  locatingCurrentPosition?: boolean;
}

// WorkbenchHeader 负责顶部品牌、搜索、城市和分类筛选区域。
export function WorkbenchHeader({
  cities,
  selectedCityId,
  cityName,
  tags,
  searchKeyword,
  activeFilter,
  currentUser,
  onCityChange,
  onSearchKeywordChange,
  onActiveFilterChange,
  onAuthClick,
  onLocateCurrentPosition,
  onFavoritesClick,
  onTripsClick,
  onLogout,
  locatingCurrentPosition = false,
}: WorkbenchHeaderProps) {
  const filterOptions: Array<{
    label: string;
    icon: ReactNode;
    value: ActiveSpotFilter;
  }> = [
    { label: "全部", icon: <AimOutlined />, value: "all" },
    ...tags.map((tag) => ({
      label: tag.name,
      icon: getFilterIcon(tag.code),
      value: tag.code,
    })),
  ];
  const cityOptions = cities.map((city) => ({
    label: `${city.name} · ${city.provinceName}`,
    value: city.id,
  }));
  // 统一收口顶部快捷入口，避免在 JSX 里按文案分支判断点击行为。
  const quickActions = [
    {
      label: "我的位置",
      icon: <EnvironmentOutlined />,
      onClick: onLocateCurrentPosition,
    },
    { label: "路线规划", icon: <CompassOutlined />, onClick: onTripsClick },
    { label: "收藏夹", icon: <HeartOutlined />, onClick: onFavoritesClick },
  ];

  return (
    <header className={styles.topBar}>
      <AppTopHeader
        centerSlot={
          <>
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
          </>
        }
        currentUser={currentUser}
        onAuthClick={onAuthClick}
        onLogout={onLogout}
        rightSlot={
          <div className={styles.actionGroup} aria-label="快捷操作">
            {quickActions.map((action) => (
              <Button
                className={styles.actionButton}
                icon={action.icon}
                key={action.label}
                loading={
                  action.label === "我的位置" ? locatingCurrentPosition : false
                }
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
        surface="workbench"
      />

      <nav className={styles.filterRail} aria-label="景点分类筛选">
        <div className={styles.filterGroup}>
          {filterOptions.map((option) => (
            <button
              className={`${styles.filterButton} ${activeFilter === option.value ? styles.filterButtonActive : ""}`}
              type="button"
              key={option.value}
              aria-pressed={activeFilter === option.value}
              onClick={() =>
                onActiveSpotFilterChange(option.value, onActiveFilterChange)
              }
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

function onActiveSpotFilterChange(
  value: ActiveSpotFilter,
  onActiveFilterChange: (filter: ActiveSpotFilter) => void,
) {
  onActiveFilterChange(value);
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
