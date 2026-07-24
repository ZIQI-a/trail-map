import {
  AimOutlined,
  BankOutlined,
  CameraOutlined,
  CloseOutlined,
  CompassOutlined,
  DownOutlined,
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
import { Button, Input, Popover } from "antd";
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppTopHeader } from "../../common";
import type { AppUserDto } from "../../../types/auth";
import type {
  SpotTag,
  SpotTagCode,
  TravelCity,
} from "../../../types/mapWorkbench";
import {
  buildCityGroups,
  buildQuickCities,
  getShortRegionName,
  resolveAvailableInitials,
  scrollToCityGroup,
  type CityBrowseMode,
} from "./citySelectorUtils";
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
  const [cityPanelOpen, setCityPanelOpen] = useState(false);
  const [cityBrowseMode, setCityBrowseMode] =
    useState<CityBrowseMode>("province");
  const [citySearchKeyword, setCitySearchKeyword] = useState("");
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});
  const currentCity = cities.find((city) => city.id === selectedCityId);
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
  const quickCities = useMemo(
    () => buildQuickCities(cities, selectedCityId),
    [cities, selectedCityId],
  );
  const groupedCities = useMemo(
    () =>
      buildCityGroups(cities, cityBrowseMode, citySearchKeyword, selectedCityId),
    [cities, cityBrowseMode, citySearchKeyword, selectedCityId],
  );
  const availableInitials = useMemo(
    () => resolveAvailableInitials(groupedCities),
    [groupedCities],
  );
  const currentCityName = getShortRegionName(currentCity?.name ?? cityName);
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
          <div className={styles.centerControls}>
            <Input
              className={styles.searchBox}
              aria-label="搜索城市、景点或美食"
              value={searchKeyword}
              prefix={<SearchOutlined />}
              placeholder="搜索城市 / 景点 / 美食"
              allowClear
              onChange={(event) => onSearchKeywordChange(event.target.value)}
            />

            <Popover
              trigger="click"
              placement="bottomLeft"
              open={cityPanelOpen}
              overlayClassName={styles.cityPopover}
              content={
                <div className={styles.cityPanel}>
                  <div className={styles.cityPanelHeader}>
                    <div className={styles.cityPanelTitle}>
                      当前城市：{currentCityName}
                    </div>
                    <button
                      className={styles.cityPanelClose}
                      type="button"
                      aria-label="关闭城市面板"
                      onClick={() => setCityPanelOpen(false)}
                    >
                      <CloseOutlined />
                    </button>
                  </div>

                  <div className={styles.hotCityRow}>
                    <span className={styles.hotCityLabel}>全国</span>
                    <div className={styles.hotCityList}>
                      {quickCities.map((city) => (
                        <button
                          className={`${styles.hotCityButton} ${
                            city.active ? styles.hotCityButtonActive : ""
                          }`}
                          type="button"
                          key={city.id}
                          onClick={() =>
                            handleSelectCity(city.id, onCityChange, setCityPanelOpen)
                          }
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.cityPanelToolbar}>
                    <div className={styles.cityPanelTabs} aria-label="城市浏览模式">
                      <button
                        className={`${styles.cityPanelTab} ${
                          cityBrowseMode === "province"
                            ? styles.cityPanelTabActive
                            : ""
                        }`}
                        type="button"
                        onClick={() => setCityBrowseMode("province")}
                      >
                        按省份
                      </button>
                      <button
                        className={`${styles.cityPanelTab} ${
                          cityBrowseMode === "city"
                            ? styles.cityPanelTabActive
                            : ""
                        }`}
                        type="button"
                        onClick={() => setCityBrowseMode("city")}
                      >
                        按城市
                      </button>
                    </div>

                    <Input
                      className={styles.cityPanelSearch}
                      value={citySearchKeyword}
                      prefix={<SearchOutlined />}
                      placeholder={
                        cityBrowseMode === "province"
                          ? "搜索省份或城市"
                          : "搜索城市"
                      }
                      allowClear
                      onChange={(event) =>
                        setCitySearchKeyword(event.target.value)
                      }
                    />
                  </div>

                  {availableInitials.length ? (
                    <div
                      className={styles.letterRail}
                      aria-label={
                        cityBrowseMode === "province"
                          ? "按省份首字母定位"
                          : "按城市首字母定位"
                      }
                    >
                      {availableInitials.map((letter) => (
                        <button
                          className={styles.letterButton}
                          type="button"
                          key={letter}
                          aria-label={`定位到 ${letter} 组`}
                          onClick={() =>
                            scrollToCityGroup(letter, groupRefs.current)
                          }
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.cityGroupList}>
                    {groupedCities.length ? (
                      groupedCities.map((group) => (
                        <section
                          className={styles.cityGroupSection}
                          key={group.key}
                          ref={(node) => {
                            if (group.initial) {
                              groupRefs.current[group.initial] = node;
                            }
                          }}
                        >
                          <div className={styles.cityGroupTitle}>
                            {group.label}
                          </div>
                          <div className={styles.cityGroupItems}>
                            {group.items.map((item) => (
                              <button
                                className={`${styles.cityGroupItem} ${
                                  item.active ? styles.cityGroupItemActive : ""
                                }`}
                                type="button"
                                key={item.key}
                                onClick={() => {
                                  if (item.cityId) {
                                    handleSelectCity(
                                      item.cityId,
                                      onCityChange,
                                      setCityPanelOpen,
                                    );
                                  }
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </section>
                      ))
                    ) : (
                      <div className={styles.cityEmpty}>未找到匹配城市</div>
                    )}
                  </div>
                </div>
              }
              onOpenChange={(open) => setCityPanelOpen(open)}
            >
              <button className={styles.cityTrigger} type="button">
                <span className={styles.cityTriggerText}>
                  {currentCityName}
                </span>
                <DownOutlined className={styles.cityTriggerArrow} />
              </button>
            </Popover>
          </div>
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
              className={`${styles.filterButton} ${
                activeFilter === option.value ? styles.filterButtonActive : ""
              }`}
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

function handleSelectCity(
  cityId: number,
  onCityChange: (cityId: number) => void,
  setCityPanelOpen: (open: boolean) => void,
) {
  onCityChange(cityId);
  setCityPanelOpen(false);
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
